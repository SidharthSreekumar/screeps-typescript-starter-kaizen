import { uniqueNamesGenerator, Config, adjectives, names } from "unique-names-generator";

export class NameGenerator {
  public static getName(): string {
    const config: Config = {
      dictionaries: [adjectives, names],
      separator: "",
      style: "capital"
    };

    const randomName = uniqueNamesGenerator(config);

    return randomName;
  }
}
