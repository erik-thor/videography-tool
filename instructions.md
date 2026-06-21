# Developer Instructions

## PowerShell Commands
- **NEVER use the `curl` or `Invoke-WebRequest` commands**. 
- In Windows PowerShell, `curl` is aliased to `Invoke-WebRequest`. This command often hangs indefinitely in background tasks or tries to render interactive progress bars, causing process lockups.
- If web status checks or API queries are required, write a small Node.js scratch script in the `<appDataDir>\brain\<conversation-id>/scratch/` directory and execute it with `node` instead.
