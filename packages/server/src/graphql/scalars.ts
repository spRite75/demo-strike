import { UserInputError } from "apollo-server-cloud-functions";
import { GraphQLScalarType, Kind } from "graphql";
import { DateTime } from "luxon";

export const dateTimeScalar = new GraphQLScalarType<DateTime, string>({
  name: "DateTime",
  description: "ISO DateTime in the wire, Luxon DateTime in the code.",
  serialize(value) {
    return (value as DateTime).toISO();
  },
  parseValue(value) {
    return DateTime.fromISO(value as string);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return DateTime.fromISO(ast.value);
    }
    throw new UserInputError("Provided value is not a valid DateTime");
  },
});
