# Hub

This is a monorepo of different services used around my house.

## Workflow

This assumes you have Docker installed on your machine.

### Development

1. `cd` to the service you want to work on.
2. Run `docker-compose up -d` to deploy a development session to localhost
3. Make your changes
4. Commit and push

### Production

1. Run `docker-compose up -d` in the root folder
