# CivicCore 🏙️

**Empowering Communities, Resolving Issues with AI-Driven Transparency.**

CivicCore is an enterprise-grade civic issue reporting and resolution ecosystem. It bridges the gap between citizens and local authorities using a high-precision AI pipeline, real-time geofencing, and a gamified accountability system.

---

## 🔝 Project Vision
CivicCore isn't just a reporting tool; it's a trust-building platform. By requiring "Proof of Work" for ticket resolution and utilizing zero-shot classification for triage, we ensure every citizen's voice is heard and every authority's action is verified.

## 🚀 Key Features

### 👤 For Citizens
*   **Smart Reporting**: Snap a photo and let our AI (ResNet-50 + BART) categorize the issue and assess its severity.
*   **Real-time Dashboard**: Track all community issues on a high-performance interactive map (Leaflet) with dark-mode aesthetic.
*   **Civic Karma**: Earn points for valid reports and upvotes. Compete to become a top contributor in your city.
*   **Upvote System**: Already see an issue on the map? Upvote it to increase its priority instead of reporting it again!

### 👮 For Authorities (Admins)
*   **Resolution Command Center**: Manage tickets from a central hub with priority-based sorting.
*   **Proof of Work Verification**: Closing a ticket requires uploading a resolution photo, creating a transparent "Before vs After" audit trail.
*   **Automated Triage**: No more manual sorting. AI assigns reports to the correct category and severity level instantly.

## 🧠 The AI Pipeline (CivicLens Engine)
Our sophisticated AI pipeline ensures high accuracy even with complex urban imagery:
1.  **Visual Feature Extraction**: Uses `microsoft/resnet-50` to identify raw visual elements.
2.  **Context-Aware Mapping**: Translates raw labels into neutral physical descriptors.
3.  **Zero-Shot Classification**: Uses `facebook/bart-large-mnli` to classify the description into specific civic categories (Pothole, Fallen Tree, Street Light, etc.) with high confidence.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, Framer Motion |
| **Backend** | Next.js Server Actions, Socket.IO (Real-time) |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | NextAuth.js (Auth.js v5) |
| **AI/ML** | Hugging Face Inference API |
| **Maps** | Leaflet.js with Dark Matter tiles |
| **Storage** | Cloudinary (Image Management) |

## ⚡ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/shbhmexe/CivicCore.git
cd CivicCore
npm install
```

### 2. Environment Variables
Create a `.env` file with the following:
```env
DATABASE_URL="..."
AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
CLOUDINARY_URL="..."
HUGGINGFACE_API_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Sync
```bash
npx prisma db push
```

### 4. Run Development
```bash
# In one terminal:
npm run dev

# In another terminal (for real-time features):
npx ts-node server.ts
```

## 🤝 Contributing
CivicCore is an open laboratory for urban innovation. Submissions are welcome!

## 📄 License
MIT © 2026 CivicCore Team
