# Fund Valuation Web

Frontend for the Fund Valuation App.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_API_BASE_URL=http://localhost:3000/api
    ```

3.  **Run Frontend**
    ```bash
    npm run dev
    ```

## Backend Requirement
This frontend now requires the `fund-valuation-server` to be running on `http://localhost:3000`.
