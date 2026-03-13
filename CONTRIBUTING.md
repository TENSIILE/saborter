# Contributing to saborter

First off, thank you for considering contributing to `saborter`. It's people like you that make `saborter` such a great tool.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to laptev-vlad2001@yandex.ru.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
- Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
- Explain which behavior you expected to see instead and why.
- Include screenshots or animated GIFs if possible.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Provide specific examples to demonstrate the steps.
- Describe the current behavior and explain which behavior you expected to see instead and why.
- Explain why this enhancement would be useful to most `saborter` users.

## Getting Started

### Local Development

To get a local copy up and running follow these simple steps.

1. **Fork** the repo on GitHub.
2. **Clone** the project to your own machine.
3. **Install dependencies** using your preferred package manager:

```bash
npm install
# or
yarn
# or
pnpm install
```

4. **Run tests** to make sure everything is working:

```bash
npm test
# or
yarn test
# or
pnpm test
```

5. **Lint your code** to ensure it follows the project's style:

```bash
npm run verify
# or
yarn verify
# or
pnpm verify
```

6. **Build the package** to verify that the production build works:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Making Changes

1. Create a branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. Make your changes and commit them using Conventional Commits.
3. Ensure that tests pass and the code is linted.
4. Push your branch to your fork.
5. Open a pull request against the `master` (or `develop`) branch.

## Styleguides

### Git Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelog generation. Please follow the format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

Example:

```text
feat(aborter): adds a new method
```

### JavaScript/TypeScript Styleguide

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to enforce consistent code style.
- Run `npm run verify` and `npm run format` before committing.
- Use meaningful variable names and add comments where necessary.

### Testing Styleguide

- Write unit tests for all new features and bug fixes.
- Use the existing testing framework (Jest).
- Aim for at least 80% code coverage.
- Test edge cases and error conditions.

## Additional Notes

### Pull Request

Before you create a Pull Request, you need to make sure that:

- Tests for your changes or new functionality have been written.
- Documentation for your new features has been updated or written.
- A quality text has been written for your Pull Request, with a description, usage examples, and justification for why this update is needed.

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

- **bug** – Issues that are bugs.
- **enhancement** – Issues that are feature requests.
- **documentation** – Issues or PRs related to documentation.
- **good first issue** – Good for newcomers.
- **help wanted** – Extra attention is needed.
- **needs review** – PR needs code review.

## Thank You

Your contributions to open source, large or small, make great projects like this possible. Thank you for taking the time to contribute.
