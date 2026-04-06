import { UUID } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const hashFile = async (_url: string): Promise<string | null> => {
  return UUID.get();
  // TODO: Re-enable this if necessary
  // logger.debug(`Generating hash for file from URL ${url}`);
  // const hash = crypto.createHash('sha1');
  // try {
  //   const response = await axios.get(url, {
  //     responseType: 'arraybuffer',
  //   });
  //   const digest = hash.update(response.data, 'binary').digest('hex');
  //   logger.debug(`Generated has for file from URL ${url}`);
  //   return digest;
  // } catch (error) {
  //   logger.error(
  //     `Could not download content from url ${url} for hash generation`,
  //   );
  //   return null;
  // }
};
