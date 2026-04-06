import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';
import { HistoryRepository } from './history-repository';

const auth0ManagementClient = new ManagementClient({
  domain: 'domain',
  token: 'token',
});

async function run() {
  const clients = []; //emails
  const repository = await HistoryRepository.init();
  for (const client of Object.values(clients)) {
    const exists = await repository.exists(client);
    if (exists) {
      console.debug(`Client ${client} already saved in the database`);
      continue;
    }
    let users: User<AppMetadata, UserMetadata>[];
    try {
      users = await auth0ManagementClient.getUsersByEmail(client);
    } catch (error) {
      console.error(`Could not fetch user from Auth0`);
      continue;
    }
    if (users.length !== 1) {
      console.warn(`Found multiple users for email ${client}`);
      continue;
    }
    const user = users[0] as UserMetadata;
    const userId = user.user_id;
    if (!userId) {
      console.warn(`Could not find user id for user ${user.email}`);
      return;
    }

    const logs = await auth0ManagementClient.getUserLogs({ id: userId });
    await repository.insert(user.email, logs);
  }
}
run()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => console.error(error));
