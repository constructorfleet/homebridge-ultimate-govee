import {gql} from 'apollo-server';

export const typeDefs = gql`
  enum PowerStatus {
    ON
    OFF
    ISSUE
  }
  
  enum ActiveState {
    ON
    OFF
    IDLE
    ISSUE
  }
  
  enum ConnectionState {
    CONNECTED
    DISCONNECTED
  }
`;
