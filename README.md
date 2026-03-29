# DocShield

DocShield is a decentralized document verification and storage system designed to securely manage, upload, and verify documents utilizing blockchain technology and traditional Web2 backend infrastructure. It features a React frontend and a Node.js/Express backend with Web3 integration.

## Technologies Used

### Frontend (`rf` directory)
- **React.js** - Frontend framework
- **Material UI (@mui/material)** - UI components
- **Framer Motion & GSAP** - Animations
- **React PDF Viewer / pdfjs** - Document viewing in the browser
- **Axios** - API calls

### Backend (`backend` directory)
- **Node.js & Express.js** - Server framework
- **MongoDB (Mongoose)** - Database
- **Ethereum / Web3.js / Ethers.js** - Blockchain interactions
- **Truffle** - Smart contract development and testing framework
- **Passport.js & JWT** - Authentication (Local, Google OAuth, JWT)
- **Multer** - File uploads
- **Bcrypt** - Password hashing

---

## Steps to Run the Code

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) running locally or accessible via URI
- [Ganache](https://trufflesuite.com/ganache/) or another local Ethereum network (optional, if testing smart contracts locally)
- A `.env` file in the `backend` directory configured with your database and environment details.

### 1. Running the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` variables (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, etc.).
4. (Optional) Compile and migrate smart contracts if needed using Truffle:
   ```bash
   npx truffle compile
   npx truffle migrate
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   The backend will typically run on `http://localhost:5000` (or the port defined in your `.env`).

### 2. Running the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd rf
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will automatically open in your default browser at `http://localhost:3000`.

---
*Created for the DocShield project.*
