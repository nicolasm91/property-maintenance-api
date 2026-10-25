-- Development only: independent tradesmen to search and book while testing,
-- six per trade (some with a second trade). They are not Auth0 accounts, so
-- nobody can sign in as them. Safe to run again: existing emails are skipped.
WITH seed (name, last_name, email, trades) AS (
  VALUES
    ('Luis', 'Pérez', 'luis.perez@example.com', ARRAY['electrician', 'handyman']),
    ('Marcelo', 'Gómez', 'marcelo.gomez@example.com', ARRAY['electrician']),
    ('Diego', 'Fernández', 'diego.fernandez@example.com', ARRAY['electrician']),
    ('Sergio', 'Romero', 'sergio.romero@example.com', ARRAY['electrician']),
    ('Pablo', 'Acosta', 'pablo.acosta@example.com', ARRAY['electrician', 'plumber']),
    ('Gustavo', 'Benítez', 'gustavo.benitez@example.com', ARRAY['electrician']),
    ('Jorge', 'Medina', 'jorge.medina@example.com', ARRAY['plumber']),
    ('Carlos', 'Herrera', 'carlos.herrera@example.com', ARRAY['plumber']),
    ('Raúl', 'Suárez', 'raul.suarez@example.com', ARRAY['plumber', 'mason']),
    ('Hernán', 'Molina', 'hernan.molina@example.com', ARRAY['plumber', 'handyman']),
    ('Fernando', 'Castro', 'fernando.castro@example.com', ARRAY['plumber']),
    ('Daniel', 'Ortiz', 'daniel.ortiz@example.com', ARRAY['plumber']),
    ('Miguel', 'Rojas', 'miguel.rojas@example.com', ARRAY['mason']),
    ('Ramón', 'Giménez', 'ramon.gimenez@example.com', ARRAY['mason', 'handyman']),
    ('Héctor', 'Silva', 'hector.silva@example.com', ARRAY['mason']),
    ('Alberto', 'Torres', 'alberto.torres@example.com', ARRAY['mason']),
    ('Julio', 'Ríos', 'julio.rios@example.com', ARRAY['mason']),
    ('Oscar', 'Domínguez', 'oscar.dominguez@example.com', ARRAY['mason']),
    ('Martín', 'Sosa', 'martin.sosa@example.com', ARRAY['handyman']),
    ('Nicolás', 'Vega', 'nicolas.vega@example.com', ARRAY['handyman']),
    ('Federico', 'Luna', 'federico.luna@example.com', ARRAY['handyman']),
    ('Matías', 'Cabrera', 'matias.cabrera@example.com', ARRAY['handyman', 'electrician']),
    ('Lucas', 'Ferreyra', 'lucas.ferreyra@example.com', ARRAY['handyman']),
    ('Cristian', 'Aguirre', 'cristian.aguirre@example.com', ARRAY['handyman'])
),
inserted AS (
  INSERT INTO "users" ("auth0_sub", "email", "name", "last_name", "role", "updated_at")
  SELECT 'seed|' || "email", "email", "name", "last_name", 'tradesman', now()
  FROM seed
  ON CONFLICT ("email") DO NOTHING
  RETURNING "id", "email"
)
INSERT INTO "tradesmen" ("user_id", "trades")
SELECT inserted."id", seed."trades"::"trade"[]
FROM inserted
JOIN seed ON seed."email" = inserted."email";
