import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  neo4j: {
    uri: string;
    username: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  elasticsearch: {
    node: string;
    auth?: {
      username: string;
      password: string;
    };
  };
}

interface ServerConfig {
  host: string;
  port: number;
}

interface FrontendConfig {
  url: string;
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  baseUrl: string;
  twitter: {
    consumerKey: string;
    consumerSecret: string;
    callbackURL: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
}

interface AIConfig {
  baseUrl: string;
  timeout: number;
}

interface AppConfig {
  environment: string;
  server: ServerConfig;
  frontend: FrontendConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  ai: AIConfig;
}

const requiredEnvVars = [
  "NODE_ENV",
  "JWT_SECRET",
  "POSTGRES_HOST",
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "NEO4J_URI",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
  "REDIS_HOST",
  "ELASTICSEARCH_NODE",
];

// Validate required environment variables (only in production)
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0 && process.env["NODE_ENV"] === "production") {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
} else if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables (using defaults for development): ${missingEnvVars.join(", ")}`
  );
}

export const config: AppConfig = {
  environment: process.env["NODE_ENV"] || "development",

  server: {
    host: process.env["SERVER_HOST"] || "0.0.0.0",
    port: parseInt(process.env["PORT"] || "3001", 10),
  },

  frontend: {
    url: process.env["FRONTEND_URL"] || "http://localhost:3000",
  },

  database: {
    postgres: {
      host: process.env["POSTGRES_HOST"] || "localhost",
      port: parseInt(process.env["POSTGRES_PORT"] || "5432", 10),
      database: process.env["POSTGRES_DB"] || "social_ai_dev",
      username: process.env["POSTGRES_USER"] || "dev_user",
      password: process.env["POSTGRES_PASSWORD"] || "dev_password",
      ssl: process.env["POSTGRES_SSL"] === "true",
    },

    neo4j: {
      uri: process.env["NEO4J_URI"] || "bolt://localhost:7687",
      username: process.env["NEO4J_USERNAME"] || "neo4j",
      password: process.env["NEO4J_PASSWORD"] || "dev_password",
    },

    redis: {
      host: process.env["REDIS_HOST"] || "localhost",
      port: parseInt(process.env["REDIS_PORT"] || "6379", 10),
      password: process.env["REDIS_PASSWORD"] || undefined,
    },

    elasticsearch: {
      node: process.env["ELASTICSEARCH_NODE"] || "http://localhost:9200",
      auth:
        process.env["ELASTICSEARCH_USERNAME"] &&
        process.env["ELASTICSEARCH_PASSWORD"]
          ? {
              username: process.env["ELASTICSEARCH_USERNAME"],
              password: process.env["ELASTICSEARCH_PASSWORD"],
            }
          : undefined,
    },
  },
  auth: {
    jwtSecret:
      process.env["JWT_SECRET"] || "dev_jwt_secret_change_in_production",
    jwtExpiresIn: process.env["JWT_EXPIRES_IN"] || "7d",
    baseUrl: process.env["BASE_URL"] || "http://localhost:3001",

    twitter: {
      consumerKey: process.env["TWITTER_CONSUMER_KEY"] || "",
      consumerSecret: process.env["TWITTER_CONSUMER_SECRET"] || "",
      callbackURL:
        process.env["TWITTER_CALLBACK_URL"] || "/api/auth/twitter/callback",
    },

    reddit: {
      clientId: process.env["REDDIT_CLIENT_ID"] || "",
      clientSecret: process.env["REDDIT_CLIENT_SECRET"] || "",
      callbackURL:
        process.env["REDDIT_CALLBACK_URL"] || "/api/auth/reddit/callback",
    },
  },

  ai: {
    baseUrl: process.env["AI_SERVICE_URL"] || "http://localhost:8000",
    timeout: parseInt(process.env["AI_SERVICE_TIMEOUT"] || "30000", 10),
  },
};
