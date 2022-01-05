import {RestEvent} from './RestEvent';
import {AuthenticationData} from '../../../structures/AuthenticationData';
import {AuthenticationCredentials} from '../../../structures/AuthenticationCredentials';

export class RestAuthenticateEvent<CredType extends AuthenticationCredentials>
  extends RestEvent<CredType> {

  constructor(eventData: CredType) {
    super('Authenticate', eventData);
  }
}

export class RestAuthenticatedEvent<AuthType extends AuthenticationData>
  extends RestEvent<AuthType> {

  constructor(
    eventData: AuthType,
  ) {
    super('Authenticated', eventData);
  }
}