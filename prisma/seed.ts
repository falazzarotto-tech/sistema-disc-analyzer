import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando Seed...')
  
  const testUser = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      name: 'Administrador de Teste',
      email: 'admin@sistema.com',
    },
  })

  console.log(`✅ Usuário de teste criado/verificado: ${testUser.email}`)
  console.log('🚀 Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
