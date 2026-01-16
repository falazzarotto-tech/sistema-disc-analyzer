import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'teste@anima.com' },
    update: {},
    create: {
      name: 'TESTE PADRÃO ÂNIMA',
      email: 'teste@anima.com',
      context: 'Validação de Sistema'
    }
  })
  console.log('----------------------------------')
  console.log('✅ USUÁRIO DE TESTE PRONTO!')
  console.log('ID DO USUÁRIO:', user.id)
  console.log('----------------------------------')
}

main().catch(console.error).finally(() => prisma.$disconnect())
