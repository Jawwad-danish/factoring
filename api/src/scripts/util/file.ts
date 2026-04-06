import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import * as fs from 'fs';
import { ParsingReport } from './report';

export const fileExists = (path: string): boolean => {
  return fs.existsSync(path);
};

export const writeObject = (
  content: object,
  path = __dirname,
  name = 'result.json',
) => {
  try {
    fs.writeFileSync(`${path}/${name}`, JSON.stringify(content));
  } catch (error) {
    console.error(`Could not write contents to file ${path}`);
    console.log(error);
    console.log(content);
  }
};

export const getFiles = (fromDirectoryPath: string): string[] => {
  const items = fs.readdirSync(fromDirectoryPath, {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const item of items) {
    const path = `${fromDirectoryPath}/${item.name}`;
    if (item.isFile()) {
      files.push(path);
    } else if (item.isDirectory()) {
      files.push(...getFiles(path));
    }
  }
  return files.sort();
};

const getSkipFiles = (): string[] => {
  const skipFileLocation = `${__dirname}/skip.json`;
  if (fs.existsSync(skipFileLocation)) {
    const contents = fs.readFileSync(skipFileLocation);
    const ids = JSON.parse(contents.toString()) as string[];
    return ids.map((id) => `${id}.json`);
  }
  return [];
};

export const getRemainingFiles = async (
  fromDirectoryPath: string,
  databaseService: DatabaseService,
  entityName: EntityName<any>,
): Promise<string[]> => {
  const files = fs.readdirSync(fromDirectoryPath);
  console.log(`A total of ${files.length} files were found.`);

  const processedIds = await databaseService.withRequestContext(async () => {
    const em = databaseService.getMikroORM().em as EntityManager;
    const entities = await em
      .createQueryBuilder(entityName)
      .select('id')
      .getResultList();
    return entities.map((entity) => entity.id);
  });
  if (processedIds.length === 0) {
    return files;
  }

  console.log(
    `A total of ${processedIds.length} entities are saved in the database.`,
  );
  const processedFiles = new Set(processedIds.map((id) => `${id}.json`));
  getSkipFiles().forEach((file) => processedFiles.add(file));
  return files.filter((file) => !processedFiles.has(file));
};

export const parseJSON = (filePath: string, report?: ParsingReport): any[] => {
  try {
    const content = fs.readFileSync(filePath);
    const entities = JSON.parse(content.toString());
    return entities;
  } catch (error) {
    report?.addFailedParsedFiles(filePath);
    console.error(`There was an error processing the file ${filePath}`, error);
    return [];
  }
};
