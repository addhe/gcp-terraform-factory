# GCP Terraform IaC Generator

An application to generate a complete Terraform codebase for deploying common GCP infrastructure, including VPC, GKE, Compute Engine, and more. Users can configure resources through a UI and get ready-to-use IaC files, powered by the Google Gemini API.

## Features

- **Intuitive UI**: Easily configure your GCP resources through a simple web interface.
- **Modular Configuration**: Enable or disable modules for VPC, GKE, Compute Engine, Firewall, and Secret Manager.
- **Dynamic IaC Generation**: Uses the Google Gemini API to generate production-ready Terraform code based on your configuration.
- **Complete Codebase**: Generates `main.tf`, `variables.tf`, `outputs.tf`, a `README.md` for the generated code, a `setup.sh` script for the GCS backend, and a `LICENSE` file.
- **Real-time Preview**: View the generated files in a tabbed code panel with syntax highlighting and a copy-to-clipboard feature.

## Getting Started

### Prerequisites

- Node 18+ / npm (for building the app)
- Docker (recommended for production-like runs)
- A valid Google Gemini API key

### Local development (vite)

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app:

Visit http://localhost:5173 (vite default) in your browser.

### Build and run with Docker (recommended)

The repository includes a multi-stage `Dockerfile` that builds the production assets with Node and serves them with Nginx. At container start the `docker-entrypoint.sh` script will replace the `__API_KEY__` placeholder in `index.html` with the `API_KEY` environment variable.

Build the image:

```bash
docker build -t gcp-iac-generator:latest .
```

Run the container (inject API key at runtime):

```bash
docker run --rm -e API_KEY="your_gemini_api_key" -p 8080:80 gcp-iac-generator:latest
```

Open http://localhost:8080

If you don't provide `API_KEY` the entrypoint will leave the placeholder intact and the app will show an informational state.

### Tests and coverage

Unit tests use Vitest. Run tests with:

```bash
npm test
```

To run coverage (may require installing a coverage provider matching your Vitest version, e.g. `@vitest/coverage-istanbul`):

```bash
npm run test:coverage
```

If you run into coverage provider installation issues, install the provider matching your Vitest version or use `c8` as an alternative coverage wrapper.

Current date: 2025-09-17
    Using `npx serve`:
    ```bash
    npx serve .
    ```

    The application will then be available at `http://localhost:3000` (or another port specified by the server).

## How It Works

The application presents a configuration panel where you can specify the details of your desired GCP infrastructure. When you click "Generate IaC with Gemini," the application:

1.  Constructs a detailed prompt from your configuration settings.
2.  Sends this prompt to the Google Gemini API (`gemini-2.5-flash` model).
3.  Requests the AI to generate a JSON object containing the content for all necessary Terraform files (`main.tf`, `variables.tf`, etc.), a `README.md`, and a `setup.sh` script.
4.  Parses the JSON response from the API.
5.  Displays the generated file contents in a user-friendly, tabbed code viewer.

## License

This project is licensed under the MIT License.
