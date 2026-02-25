import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding fiscal_parameters 2026...");

  const fiscalParams = [
    { key: "UVT", valuePesos: 52374, valueUvt: null, isUvtBased: false, description: "Valor UVT 2026" },
    { key: "SMLMV", valuePesos: 1750905, valueUvt: null, isUvtBased: false, description: "Salario Minimo Legal Mensual Vigente 2026" },
    { key: "AUXILIO_TRANSPORTE", valuePesos: 249095, valueUvt: null, isUvtBased: false, description: "Auxilio de transporte / conectividad legal 2026" },
    { key: "GMF_RATE", valuePesos: 0.004, valueUvt: null, isUvtBased: false, description: "Tasa GMF — actualmente 4x1000" },
    { key: "EXENCION_GMF_CUENTAS", valuePesos: null, valueUvt: 350, isUvtBased: true, description: "Tope exencion GMF cuentas corriente/ahorro (350 UVT/mes)" },
    { key: "DBM_MONTHLY_LIMIT_UVT", valuePesos: null, valueUvt: 210.5, isUvtBased: true, description: "Tope mensual entradas/salidas Deposito de Bajo Monto (210.5 UVT)" },
    { key: "DBM_GMF_EXEMPT_UVT", valuePesos: null, valueUvt: 65, isUvtBased: true, description: "Tope exencion GMF en Deposito de Bajo Monto (65 UVT/mes)" },
    { key: "RENTA_TOPE_INGRESOS_UVT", valuePesos: null, valueUvt: 1400, isUvtBased: true, description: "Tope ingresos declaracion de renta (1.400 UVT)" },
    { key: "RENTA_TOPE_PATRIMONIO_UVT", valuePesos: null, valueUvt: 4500, isUvtBased: true, description: "Tope patrimonio declaracion de renta (4.500 UVT)" },
    { key: "RETENCION_FUENTE_BASE_UVT", valuePesos: null, valueUvt: 95, isUvtBased: true, description: "Tope base depurada retencion en la fuente (95 UVT)" },
    { key: "PENSION_EXENTO_UVT", valuePesos: null, valueUvt: 1000, isUvtBased: true, description: "Renta exenta pensionados (1.000 UVT/mes)" },
    { key: "SANCION_MINIMA_UVT", valuePesos: null, valueUvt: 10, isUvtBased: true, description: "Sancion minima DIAN (10 UVT)" },
  ];

  for (const p of fiscalParams) {
    await prisma.fiscalParameter.upsert({
      where: { year_key: { year: 2026, key: p.key } },
      update: {},
      create: {
        year: 2026,
        key: p.key,
        ...(p.valuePesos !== null ? { valuePesos: p.valuePesos } : {}),
        ...(p.valueUvt !== null ? { valueUvt: p.valueUvt } : {}),
        isUvtBased: p.isUvtBased,
        description: p.description,
      },
    });
  }
  console.log("  fiscal_parameters done");

  console.log("Seeding app_config...");
  const appConfigs = [
    { key: "REGISTRATION_MODE", value: "INVITE_ONLY", description: "Modo de registro: OPEN | INVITE_ONLY | CLOSED" },
    { key: "CUTOFF_WARNING_DAYS", value: "3", description: "Dias antes del corte TC para marcar compra como near_cutoff" },
    { key: "DBM_RESET_CRON", value: "0 0 1 * *", description: "Cron para reset mensual contadores DBM" },
    { key: "INVITATION_EXPIRY_HOURS", value: "72", description: "Horas de vigencia de un token de invitacion" },
  ];
  for (const c of appConfigs) {
    await prisma.appConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }
  console.log("  app_config done");

  console.log("Seeding categories (sistema)...");
  const categoryTree: { name: string; icon: string; children: string[] }[] = [
    { name: "Vivienda", icon: "home", children: ["Arriendo", "Servicios publicos", "Internet", "Cuota de administracion"] },
    { name: "Alimentacion", icon: "utensils", children: ["Mercado", "Restaurantes", "Domicilios"] },
    { name: "Transporte", icon: "car", children: ["Transporte publico", "Gasolina", "Parqueadero", "Taxi/App"] },
    { name: "Salud", icon: "heart", children: ["Medico", "Medicamentos", "Prepagada", "Gimnasio"] },
    { name: "Educacion", icon: "book", children: ["Matricula", "Material", "Cursos"] },
    { name: "Entretenimiento", icon: "tv", children: ["Streaming", "Salidas", "Hobbies"] },
    { name: "Vestimenta", icon: "shirt", children: ["Ropa", "Calzado", "Accesorios"] },
    { name: "Finanzas", icon: "credit-card", children: ["Cuota TC", "Cuota credito", "Ahorro", "Inversion"] },
    { name: "Bancario", icon: "building-2", children: ["Cuota de manejo", "Comisiones", "4x1000"] },
    { name: "Trabajo", icon: "briefcase", children: ["Herramientas", "Internet trabajo", "Transporte laboral"] },
    { name: "Otro", icon: "circle-dot", children: ["Sin categoria"] },
  ];

  for (const parent of categoryTree) {
    let parentRecord = await prisma.category.findFirst({
      where: { name: parent.name, isSystem: true, parentId: null },
    });
    if (!parentRecord) {
      parentRecord = await prisma.category.create({
        data: { name: parent.name, icon: parent.icon, level: 1, isSystem: true },
      });
    }
    for (const childName of parent.children) {
      const existing = await prisma.category.findFirst({
        where: { name: childName, isSystem: true, parentId: parentRecord!.id },
      });
      if (!existing) {
        await prisma.category.create({
          data: { name: childName, level: 2, isSystem: true, parentId: parentRecord!.id },
        });
      }
    }
  }
  console.log("  categories done");

  console.log("Seeding financial_entities...");
  const entities: { name: string; entityType: "BANCO" | "FINTECH" | "COOPERATIVA"; nit?: string }[] = [
    { name: "Bancolombia", entityType: "BANCO", nit: "890903938" },
    { name: "Banco de Bogota", entityType: "BANCO", nit: "860007738" },
    { name: "Davivienda", entityType: "BANCO", nit: "860034313" },
    { name: "BBVA Colombia", entityType: "BANCO", nit: "860003580" },
    { name: "Banco Popular", entityType: "BANCO", nit: "899999028" },
    { name: "Banco de Occidente", entityType: "BANCO", nit: "890300279" },
    { name: "Itau Colombia", entityType: "BANCO", nit: "890903937" },
    { name: "Caja Social", entityType: "BANCO", nit: "860007335" },
    { name: "AV Villas", entityType: "BANCO", nit: "860035827" },
    { name: "Scotiabank Colpatria", entityType: "BANCO", nit: "860034958" },
    { name: "Banco Agrario", entityType: "BANCO", nit: "800037800" },
    { name: "Nequi", entityType: "FINTECH", nit: "900285884" },
    { name: "Daviplata", entityType: "FINTECH", nit: "800002297" },
    { name: "Rappipay", entityType: "FINTECH" },
    { name: "Movii", entityType: "FINTECH" },
    { name: "Confiar Cooperativa", entityType: "COOPERATIVA" },
    { name: "Cootrafa", entityType: "COOPERATIVA" },
    { name: "JFK Cooperativa", entityType: "COOPERATIVA" },
  ];
  for (const e of entities) {
    const existing = await prisma.financialEntity.findFirst({ where: { name: e.name, isPublic: true } });
    if (!existing) {
      await prisma.financialEntity.create({
        data: { name: e.name, entityType: e.entityType, nit: e.nit ?? null, isActive: true, isPublic: true },
      });
    }
  }
  console.log("  financial_entities done");

  console.log("\u2705 Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
