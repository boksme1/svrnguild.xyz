// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DATABASE_URL",
    description: "NeonDB PostgreSQL database connection string for all database operations",
    required: true,
    instructions: "Use your NeonDB connection string in the format:\npostgresql://username:password@host/database?sslmode=require&channel_binding=require\n\nExample: postgresql://neondb_owner:your_password@ep-xxx.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  },
  {
    name: "JWT_SECRET",
    description: "Secret key for signing JWT tokens for admin authentication",
    required: true,
    instructions: "Use this generated secret:\n7d1df3c0411d43a015d9a45c620d0a5d216b4e412c52b75f44e06e4525f983271f983fb9339fcff10b6450e6a0a776b5277ed0338b52536d9dfca3731f8ec88b"
  }
];

export interface EnvVariable {
  name: string
  description: string
  instructions: string
  required: boolean
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(envVar => envVar.required && !process.env[envVar.name]).map(envVar => envVar.name)
}