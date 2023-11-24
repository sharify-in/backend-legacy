declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      FRONTEND_URL: string;
      DATABASE_URL: string;
      REDIS_URI: string;
      SESSION_SECRET: string;
      MINIO_ENDPOINT: string;
      MINIO_PORT: string;
      MINIO_USE_SSL: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET_NAME: string;
      CDN_URL: string;
      MAILERSEND_API_KEY: string;
    }
  }
}
