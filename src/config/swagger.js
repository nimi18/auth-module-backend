// src/config/swagger.js
/**
 * Swagger / OpenAPI Configuration
 * --------------------------------
 * Generates the OpenAPI specification used by Swagger UI.
 *
 * Documentation strategy:
 * - Enterprise envelope is the documented public contract
 * - Shared schemas are defined once here
 * - Endpoint-level docs live in controller files through @openapi blocks
 *
 * Notes:
 * - Swagger UI is mounted in app.js
 * - Swagger is disabled in test mode to keep test execution isolated
 */

const swaggerJSDoc = require("swagger-jsdoc");
const { APP_BASE_URL } = require("./env");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Auth Module Backend API",
      version: "1.0.0",
      description:
        "Enterprise-grade authentication microservice providing local authentication, social authentication, password recovery, and secure identity APIs.",
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: APP_BASE_URL,
        description: "Application server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Local authentication and authenticated user endpoints",
      },
      {
        name: "Password",
        description: "Forgot password and reset password flows",
      },
      {
        name: "Social Auth",
        description: "Google and Facebook authentication flows",
      },
      {
        name: "Health",
        description: "Service health endpoint",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT Authorization header using the Bearer scheme. Example: 'Authorization: Bearer <token>'",
        },
      },
      schemas: {
        User: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              example: "65c2f5b3e7c9a9a1b2c3d4e5",
            },
            name: {
              type: "string",
              example: "Nimita Malhotra",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
          },
          required: ["id", "name", "email"],
        },

        AuthData: {
          type: "object",
          additionalProperties: false,
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
          required: ["user", "token"],
        },

        MeData: {
          type: "object",
          additionalProperties: false,
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
          },
          required: ["user"],
        },

        MessageData: {
          type: "object",
          additionalProperties: false,
          properties: {
            message: {
              type: "string",
              example: "Password updated successfully",
            },
          },
          required: ["message"],
        },

        ForgotPasswordData: {
          type: "object",
          additionalProperties: false,
          properties: {
            message: {
              type: "string",
              example: "If an account exists, a reset link has been sent.",
            },
            resetToken: {
              type: "string",
              description:
                "Returned only in NODE_ENV=test to support automated tests. Never expose this in production responses.",
              example: "a1b2c3d4e5f6...",
            },
          },
          required: ["message"],
        },

        EnvelopeSuccessAuth: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/AuthData",
            },
          },
          required: ["success", "data"],
        },

        EnvelopeSuccessMe: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/MeData",
            },
          },
          required: ["success", "data"],
        },

        EnvelopeSuccessMessage: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/MessageData",
            },
          },
          required: ["success", "data"],
        },

        EnvelopeSuccessForgotPassword: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              $ref: "#/components/schemas/ForgotPasswordData",
            },
          },
          required: ["success", "data"],
        },

        EnvelopeError: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              additionalProperties: false,
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                },
                message: {
                  type: "string",
                  example: "Email and password are required",
                },
              },
              required: ["code", "message"],
            },
          },
          required: ["success", "error"],
        },

        HealthResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              additionalProperties: false,
              properties: {
                status: {
                  type: "string",
                  example: "ok",
                },
                uptime: {
                  type: "number",
                  example: 123.45,
                },
                timestamp: {
                  type: "string",
                  example: "2026-02-28T00:00:00.000Z",
                },
              },
              required: ["status", "uptime", "timestamp"],
            },
          },
          required: ["success", "data"],
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          description: "Returns service health, uptime, and timestamp.",
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/HealthResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;