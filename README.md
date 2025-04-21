# core-sky-cli 💎

Automated Coresky check-in bot with a real-time Terminal UI (TUI), built from scratch with enhanced features and clear separation of concerns.

## Features ✨

* **Automated Daily Check-ins:** Runs check-ins for multiple accounts every 24 hours.
* **Real-time TUI Dashboard:** Uses `blessed` to provide a dynamic terminal interface:
    * **Main Log:** Shows all informational, warning, error, and wait messages with timestamps and emojis (ℹ️, ✅, ⚠️, 🚨, ⌛).
    * **Success Log:** Specifically tracks successful check-ins and "already checked in" statuses.
    * **Status Info:** Displays bot status (RUNNING, WAITING, etc.), loaded token count, individual token status (Valid/Expired/Checked), and a countdown to the next run.
* **Token Management:** Reads JWT tokens securely from `token.txt`.
* **JWT Validation:** Checks for token expiration before attempting check-in.
* **Modular Structure:** Code organized into services, utilities, TUI components, and core logic.
* **Event-Driven:** Uses an `EventEmitter` to decouple bot logic from the UI.
* **Automated Scaffolding:** Includes a script (`npm run scaffold`) to generate the project structure.
* **VS Code Integration:** Provides basic `.vscode` settings for ESLint/Prettier.
* **Clean Exit:** Handles `Ctrl+C` gracefully to stop timers and restore the terminal.

## Installation ⚙️

1.  **Clone the repository:**
    *(Replace `<your-repo-url>` with the actual URL if you host it on GitHub/GitLab etc.)*
    ```bash
    git clone <your-repo-url> core-sky-cli
    cd core-sky-cli
    ```
    *Alternatively, if you don't have a repo yet, just create the `core-sky-cli` directory manually and place the files inside.*

2.  **Install dependencies:**
    Make sure you have Node.js v18 or later installed.
    ```bash
    npm install
    ```

3.  **Run the scaffolding script (Important!):**
    This script creates the necessary directories and placeholder files if they don't exist. It's safe to run even if files are already present.
    ```bash
    npm run scaffold
    ```

4.  **Add your Coresky Tokens:**
    Open the `token.txt` file in the project's root directory. Add your Coresky JWT tokens, one token per line. Lines starting with `#` are ignored.
    ```
    # Add your Coresky JWT tokens here, one per line.
    # Example:
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...yourFirstToken...
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...yourSecondToken...
    # anotherTokenHere...
    ```

5.  **(Optional) Open in VS Code:**
    If you have VS Code and the `code` command line launcher installed:
    ```bash
    code .
    ```
    VS Code will suggest recommended extensions (ESLint, Prettier) defined in `.vscode/extensions.json`.

## Usage ▶️

Start the bot and the TUI:

```bash
npm start
```

The terminal will clear and display the TUI dashboard. The bot will load tokens, perform an initial check-in cycle, and then schedule subsequent runs every 24 hours.

**Exiting:** Press `Ctrl+C` to shut down the application cleanly.

## TUI Layout 🖥️

```
+--------------------------------------------------------------------------+
| 💎 CORE-SKY AUTO SIGN-IN by Crypto With Shashi 💎                        |
+--------------------------------------------------------------------------+
| 📜 Main Log                      | ✅ Success Log          |
| [HH:MM:SS] ℹ️ TUI Initialized...  | [HH:MM:SS] ✅ [Acc 1] +10 pts |
| [HH:MM:SS] 🔑 Loaded 2 keys...   | [HH:MM:SS] ⚠️ [Acc 2] Done  |
| [HH:MM:SS] 🚀 Starting cycle...  |                         |
| [HH:MM:SS] --- Proc. Acc 1 ---   |                         |
| [HH:MM:SS] 📡 Attempting sign-in |                         |
| [HH:MM:SS] ✅ [Acc 1] +10 pts    +-------------------------+
| [HH:MM:SS] ⌛ Waiting 3s...      | 📊 Status Info          |
| [HH:MM:SS] --- Proc. Acc 2 ---   | Bot Status: WAITING     |
| [HH:MM:SS] 📡 Attempting sign-in | Tokens Loaded: 2        |
| [HH:MM:SS] ⚠️ [Acc 2] Already... | Token Status:           |
| [HH:MM:SS] ✅ Cycle finished.    |  Key 1: eyJ...AbCd (✅) |
| [HH:MM:SS] ⏳ Scheduling next... |  Key 2: eyJ...XyZ (⚠️) |
|                                  | Next Check-in: 23h 59m 50s|
+----------------------------------+-------------------------+
```
*(Layout is approximate and depends on terminal size)*

## Troubleshooting ❓

* **`Token file not found`:** Ensure `token.txt` exists in the root directory where you run `npm start` and that you ran `npm run scaffold`.
* **`No valid API keys found`:** Check `token.txt`. Make sure tokens are valid JWTs, one per line, and no extra characters are present. Remove any comment lines (`#`).
* **`Token is expired`:** The JWT token has passed its expiration date. Obtain a new token from Coresky and update `token.txt`.
* **API Errors / Failures:** Check the error messages in the Main Log. It could be a network issue, an invalid token rejected by the API, or a change in the Coresky API itself.
* **TUI Looks Garbled:** Ensure your terminal supports Unicode (UTF-8) and has sufficient width/height. Try resizing the terminal window.

---
*This project is for educational purposes. Use responsibly and in accordance with Coresky's terms of service.*
