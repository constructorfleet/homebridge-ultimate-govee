import {gql} from 'apollo-server';

export const typeDefs = gql`
  enum FanLevel {
    OFF
    LOW
    MEDIUM
    HIGH
    ISSUE
  }
`;
