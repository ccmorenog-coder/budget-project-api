import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js';
import { UpdateWalletDto } from './dto/update-wallet.dto.js';
import { WalletsService } from './wallets.service.js';

@ApiTags('wallets')
@ApiBearerAuth('access-token')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created' })
  create(
    @Body() dto: CreateWalletDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active wallets for the current user' })
  @ApiResponse({ status: 200, description: 'List of wallets' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.walletsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single wallet by ID' })
  @ApiResponse({ status: 200, description: 'Wallet found' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wallet' })
  @ApiResponse({ status: 200, description: 'Wallet updated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWalletDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a wallet' })
  @ApiResponse({ status: 204, description: 'Wallet deactivated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.remove(req.user.id, id);
  }

  @Post(':id/transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a transaction (applies GMF/DBM logic automatically)',
  })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  createTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTransactionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.createTransaction(req.user.id, id, dto);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Paginated transaction history for a wallet' })
  @ApiResponse({ status: 200, description: 'Paginated transactions' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListTransactionsQueryDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.walletsService.findTransactions(req.user.id, id, query);
  }
}
