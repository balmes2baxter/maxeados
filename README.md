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

## 🚀 Arquitectura y Tecnologías Propuestas

* **Stack Fullstack:** Next.js (App Router, React 19 / TypeScript, Tailwind CSS) o API Node/Express + Frontend React Vite.
* **Base de Datos:** PostgreSQL con Prisma ORM o Drizzle ORM.
* **Diseño UI:** Mobile-first con modo oscuro / estética gym de alto contraste (Dark mode, acentos fluorescentes/dorados, badges de estado).
