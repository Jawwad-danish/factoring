## Factroring
This repository contains the Factoring application.

### Repository folder structure
```
bobtail-ng/
├── api/                    # NestJS API application
├── cdk/                    # AWS CDK infrastructure
└── @fs-bobtail-factoring/  # Shared code package
```

### Get Started

#### Configure NPM globally
Create a `.npmrc` file in your user directory (e.g. `~/.npmrc` for UNIX operating systems) and add the following content
```
//npm.pkg.github.com/:_authToken={token}
```
To generate a new token, please follow this [GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-per[…]s-token-classic).

#### Initial Setup

Clone this repository using the https url
```bash
git clone https://github.com/fs-bobtail/bobtail-ng.git
cd bobtail-ng
```

Install dependencies
```bash
cd @fs-bobtail-factoring && npm install && cd ..
cd api && npm install && cd ..
cd cdk && npm install && cd ..
```
**Note**: Each package manages its own dependencies independently. There is no workspace linking.

## Running the API

### Prerequisites
See [API Prerequisites](api/README.md#prerequisites) for AWS SSO setup and database configuration.

### Quick Start
```bash
$ cd api
$ npm run start:dev
```

## Shared Code Package (@fs-bobtail-factoring)
The **@fs-bobtail-factoring** package contains shared code (DTOs, validators, types) that can be used across multiple projects.

### Purpose
* **Single source of truth** for shared data structures
* **Type safety** across projects
* **No code duplication** between repositories
* **Version control** for shared dependencies

### Local Development
The API uses the published version from GitHub Packages. **Do not use `file:` symlinks** — they cause duplicate `class-transformer` metadata registries, which breaks BigJS serialization and other decorator-based transforms at runtime.

#### To test local changes before publishing

Use `npm pack` to create a local tarball. This installs the package the same way npm would from the registry (no symlinks), without publishing untested versions.

1. Make your changes in **@fs-bobtail-factoring**
2. Build and pack
```bash
cd @fs-bobtail-factoring
npm run build
npm pack
```
This creates a file like `fs-bobtail-factoring-<new-version>.tgz` in the directory.

3. Install the tarball in the API
```bash
cd api
npm install ../\@fs-bobtail-factoring/fs-bobtail-factoring-<new-version>.tgz
```
4. Start the API and verify
```bash
npm run start:dev
```
5. When done testing, **revert** the `package.json` and `package-lock.json` changes in the API before committing
```bash
git checkout package.json package-lock.json
npm install
```

### Publishing New Version
When you make changes to the shared package and want to use them in other projects:

1. Make your changes in **@fs-bobtail-factoring**
2. Bump the version
```bash
cd @fs-bobtail-factoring

# Increment version (choose one)
npm version patch   # 0.0.1 -> 0.0.2 (bug fixes)
npm version minor   # 0.0.1 -> 0.1.0 (new features)
npm version major   # 0.0.1 -> 1.0.0 (breaking changes)
```
3. Publish to GitHub Packages
```bash
# Ensure you have NPM_TOKEN set (GitHub Personal Access Token with write:packages scope)
# This step can be skipped if you have NPM token configured in your global .npmrc file
export NPM_TOKEN=your_github_token

# Publish
npm publish
```
4. Update existing projects
```bash
cd api
npm install @fs-bobtail/factoring@latest
```

## Using in Other projects
Add to your project's package.json:
```json
{
  "dependencies": {
    "@fs-bobtail-factoring": "^0.0.1"
  }
}
```
Create **.npmrc** file in the root directory of your project with the following content:
```ini
@fs-bobtail:registry=https://npm.pkg.github.com
```
Then install
```bash
npm install
```

### Deployment
* **CI/CD** uses the published version from GitHub Packages
* **Docker builds** authenticate with NPM_TOKEN
* **Local development** uses GitHub Packages

### Troubleshooting
**CI/CD fails with 404 for GitHub Actions Packages**

Ensure the **registry-url** option is set in your GitHub Actions step.

```yaml 
- name: Use Node.js 22.x
  uses: actions/setup-node@v4
  with:
    node-version: 22.x
    cache: npm
    cache-dependency-path: api/package-lock.json
    registry-url: 'https://npm.pkg.github.com/'
```

**CI/CD fails with 401 for GitHub Actions Packages**

Ensure the **NODE_AUTH_TOKEN** environment variable is set in your GitHub Actions step.

```yaml 
- name: Install npm dependencies
  run: npm install
  working-directory: api
  env:
    NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

**Docker build fails with 404 for shared package**

Ensure the package is published and **NPM_TOKEN** is set in your CI/CD environment.
