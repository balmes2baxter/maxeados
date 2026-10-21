# Maxeados 🏋️‍♂️💥

Plataforma de competencia fitness y fuerza relativa para gimnasios. Los atletas compiten por llevar las máquinas al tope de la pila de placas (*maxear*) y disputar un pozo mensual de **$100.000 COP**, bajo un algoritmo matemático equitativo que normaliza el rendimiento según el peso corporal del usuario.

---

## 🎯 Objetivo del MVP

Validar la tracción competitiva y retención comunitaria en un gimnasio piloto durante una temporada de **30 días**, permitiendo registrar levantamientos verificados en un circuito cerrado de 6 máquinas oficiales.

---

## 📐 Circuito Oficial de Máquinas

Para calificar al pozo de la temporada, el atleta debe registrar al menos un intento aprobado en cada una de las 6 estaciones:

1. **Prensa de piernas / Hack squat** (*Piernas / Cuádriceps - Glúteos*)
2. **Extensión de cuádriceps** (*Cuádriceps*)
3. **Curl femoral acostado / sentado** (*Isquiotibiales*)
4. **Jalón al pecho en polea** (*Espalda / Dorsales*)
5. **Remo sentado en polea / máquina** (*Espalda media / Romboides*)
6. **Press de pecho en máquina** (*Pecho / Tríceps*)

---

## 🧮 Algoritmo de Puntuación (Fuerza Relativa)

Para garantizar una competencia justa sin importar la contextura del competidor, el sistema no premia únicamente el volumen absoluto, sino la fuerza relativa respecto al peso corporal.

### 1. Puntaje por Máquina ($P_m$)

Para una máquina $m$ con peso máximo de catálogo $W_m$, repeticiones válidas $R$ y peso corporal verificado $PC$:

$$P_m = \left( \frac{W_m}{PC} \right) \times \left(1 + \frac{R}{30}\right)$$

* **Corte estricto de seguridad:** $1 \le R \le 15$. Cualquier repetición por encima de la 15 no suma puntaje adicional ($R_{counted} = \min(R, 15)$), evitando series de resistencia lesiva y priorizando técnica estricta.

### 2. Puntaje Global del Atleta

$$\text{Puntaje Global} = \sum_{m=1}^{6} P_m^*$$

*(Donde $P_m^*$ es el mejor puntaje aprobado del atleta en la máquina $m$ durante la temporada)*

* **Criterio de desempate:** En caso de igualdad de puntos en la tabla general, la victoria se otorga al atleta con menor peso corporal oficial registrado.
* **Criterio de calificación:** Se requiere completar las 6 máquinas con envíos aprobados (`APPROVED`) para ser elegible al pozo.

---

## 👥 Historias de Usuario (MVP)

### Atleta
* **HU-01:** Registrarse con datos básicos y peso corporal inicial.
* **HU-02:** Consultar el catálogo de las 6 máquinas oficiales y su peso tope.
* **HU-03:** Subir intento (`submission`) enviando repeticiones logradas y enlace/video de evidencia.
* **HU-04:** Consultar la tabla de clasificación (*Leaderboard*) en tiempo real con desglose por máquina.

### Administrador / Juez
* **HU-05:** Visualizar la cola de intentos pendientes (`PENDING`) con su respectivo video y peso reportado.
* **HU-06:** Aprobar (`APPROVED`) o rechazar (`REJECTED`) envíos agregando notas de retroalimentación (ej. *rango incompleto*, *rebote de placas*).

---

## 🗄️ Esquema de Base de Datos (PostgreSQL)

> Esquema conceptual. La fuente de verdad es [`supabase/migrations`](supabase/migrations).

```sql
-- Usuarios y Perfiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20),
    body_weight_kg NUMERIC(5,2) NOT NULL,
    weight_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'ATHLETE', -- 'ATHLETE', 'ADMIN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de Máquinas Oficiales
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL,
    max_weight_kg NUMERIC(6,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Temporadas / Retos
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    prize_amount_cop NUMERIC(10,2) DEFAULT 100000.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Intentos de Levantamiento
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id),
    season_id UUID REFERENCES seasons(id),
    reps_completed INT NOT NULL CHECK (reps_completed > 0),
    reps_counted INT NOT NULL, -- Clamp a máx 15 para la fórmula
    video_url TEXT NOT NULL,
    calculated_score NUMERIC(8,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Stack

* **Next.js 16** (App Router, TypeScript, Tailwind CSS v4) — mobile-first.
* **Supabase**: PostgreSQL + Auth (Google OAuth) + Storage (videos/fotos de evidencia).
* Migraciones SQL versionadas en [`supabase/migrations`](supabase/migrations) y datos iniciales en [`supabase/seed.sql`](supabase/seed.sql).

### Decisiones de la base de datos
* `users` → `profiles` (1:1 con `auth.users`), creado automáticamente al primer login con Google.
* `reps_counted`, `calculated_score`, snapshots de peso y temporada los calcula un **trigger** en Postgres: el cliente no puede falsear su puntaje.
* Evidencia: `evidence_path` (archivo en bucket privado `evidence/{user_id}/...`) o `evidence_url` (link externo).
* Vista `leaderboard`: mejor puntaje aprobado por máquina, suma global, máquinas completadas, `qualified` y desempate por menor peso.
* RLS: el atleta solo ve/crea sus intentos; el admin ve y modera todo.
* `profiles.avatar` (jsonb): personaje pixel art. `onboarded` exige nombre, peso **y** personaje.
* Vista `activity_feed`: últimos intentos aprobados (sin video) para el ticker del gym.
* Funciones de juez: `verify_weight(user, kg)` (verifica y recalcula la temporada) y `open_season(...)` (cierra la activa y abre otra).

### 🕹️ Experiencia pixel art y gamificación
* Toda la UI es pixel art: personajes de gym dibujados píxel a píxel (contextura, piel, pelo, barba, ropa, tenis, gorra/bandana/audífonos, gafas, cadena, cinturón, muñequeras), sprites de las 6 máquinas, íconos, fuentes *Press Start 2P* + *VT323*, sonidos 8-bit opcionales y animaciones suaves.
* Al entrar con Google lo primero es **crear el personaje** (obligatorio), luego la ficha con peso.
* XP por enviar (+10), aprobar (+50 + 20×puntaje), récord personal (+25), circuito completo (+200) y pesaje verificado (+30). Niveles con títulos, ligas por puntaje (Bronce → Diamante), 10 logros, misiones, rachas, *level up* y toasts de logros.

### Estructura del proyecto
```
src/
├── proxy.ts                    # Next 16 proxy: refresca sesión y protege rutas
├── lib/supabase/
│   ├── client.ts               # cliente navegador (subida directa a Storage)
│   ├── server.ts               # cliente Server Components / Actions
│   └── proxy.ts                # lógica de sesión + redirecciones
├── lib/
│   ├── avatar.ts               # motor del personaje pixel art
│   ├── game.ts                 # XP, niveles, ligas, logros, misiones, rachas
│   ├── scoring.ts              # fórmula P_m (preview en cliente; la oficial es el trigger)
│   └── data.ts / session.ts    # lecturas de Supabase y guardas de sesión
├── actions/                    # Server Actions (onboarding, intentos, juez, auth)
├── components/                 # PixelAvatar, PixelIcon, MachineSprite, creador, fx...
└── app/
    ├── login/                  # Portada + login con Google (y modo desarrollo)
    ├── auth/callback/          # Intercambio OAuth code → sesión
    ├── onboarding/             # Personaje obligatorio + ficha con peso
    └── (app)/
        ├── page.tsx            # Gym: liga, pozo, circuito, misiones, logros
        ├── maquinas/           # Catálogo y envío de intento (video a Storage o link)
        ├── ranking/            # Podio + tabla en vivo con desglose
        ├── perfil/             # Nivel, logros, datos y editor de personaje
        └── juez/               # Cola, pesos, historial y temporadas
supabase/
├── migrations/                 # Esquema, triggers, RLS, leaderboard, bucket, capa de juego
├── seed.sql                    # 6 máquinas + temporada piloto
└── seed_demo.sql               # SOLO local: juez + 8 atletas demo
```

### Roadmap MVP
| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Scaffold Next.js + Supabase | ✅ |
| 2 | Esquema DB + score por trigger + RLS + Storage | ✅ |
| 3 | Login Google + onboarding con peso (HU-01) | ✅ |
| 4 | Catálogo de máquinas (HU-02) | ✅ |
| 5 | Subir intento con video/foto a Storage (HU-03) | ✅ |
| 6 | Leaderboard en tiempo real (HU-04) | ✅ |
| 7 | Panel juez: cola PENDING, aprobar/rechazar, verificar peso (HU-05/06) | ✅ |
| 7b | Personaje pixel art obligatorio + gamificación | ✅ |
| 8 | Deploy en Vercel + PWA instalable | ⏳ |

---

## 🛠️ Setup local

```bash
npm install
cp .env.example .env.local   # completar con URL y anon key de Supabase
```

### 1. Base de datos en Supabase
```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase db push                 # aplica supabase/migrations
# Seed: pegar supabase/seed.sql en el SQL Editor (ajustar pesos tope reales)
```

### 2. Login con Google
1. Google Cloud Console → *APIs & Services → Credentials* → crear **OAuth Client ID (Web)**.
   * Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Supabase → *Authentication → Providers → Google*: pegar Client ID y Secret.
3. Supabase → *Authentication → URL Configuration*: agregar `http://localhost:3000/auth/callback` en Redirect URLs.

### 3. Convertirte en Juez/Admin
```sql
update public.profiles set role = 'ADMIN' where email = 'tu-correo@gmail.com';
```

### 4. Correr
```bash
npm run dev
```

### Alternativa: todo local, sin Google ni cuenta de Supabase
```bash
npm install
npx supabase start        # requiere Docker; aplica migraciones + seed.sql + seed_demo.sql
npm run setup:local       # escribe .env.development.local con la URL y la anon key locales
npm run dev               # http://localhost:3000
```
Cuando la app apunta a un Supabase local (`127.0.0.1`), `/login` muestra **Entrar en local** en lugar de Google: escribe cualquier correo y se crea la cuenta. Accesos rápidos: atleta nuevo, `valentina@demo.maxeados` (demo con datos) y `juez@maxeados.dev` (panel de juez). Contra un Supabase en la nube solo aparece Google. `NEXT_PUBLIC_DEV_LOGIN=true|false` fuerza el comportamiento.

`npm test` corre las pruebas de la fórmula de puntaje.
