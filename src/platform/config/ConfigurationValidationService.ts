import {Inject, Injectable, Logger} from '@nestjs/common';
import Joi, {ValidationError} from 'joi';
import {GoveePluginConfig} from './GoveePluginConfig';
import {StringConstraints} from '../../config';
import {escapeRegExp} from '../../util';

export const TOKEN_PASSWORD_CONSTRAINTS = Symbol(
    'Injection token for password constraints.',
);

export const TOKEN_USERNAME_CONSTRAINTS = Symbol(
    'Injection token for username constraints.',
);


@Injectable()
export class ConfigurationValidationService {
  private readonly BASE_CONFIG_VALUES =
      Joi.object(
          {
            username: Joi.string()
                .min(5)
                .max(20)
                .required(),
            password: Joi.string()
                .min(5)
                .max(20)
                .required(),
            enableIoT: Joi.boolean()
                .default(false),
            enableBLE: Joi.boolean()
                .default(false),
            enableAPI: Joi.boolean()
                .default(false),
          },
      );
  private readonly GRAPHQl_CONFIG_VALUES =
      Joi.object(
          {
            graphQLListenPort: Joi.string()
                .pattern(
                    new RegExp(
                        '^[a-zA-Z\\d]{3,30}$',
                    ),
                )
                .optional(),

            authToken: Joi.string()
                .min(3)
                .max(100)
                .optional(),

            introspection: Joi.boolean()
                .default(false)
                .optional(),

            playground: Joi.boolean()
                .default(false)
                .optional(),
          },
      );

  public constructor(
      private readonly log: Logger,
      private readonly goveePluginConfig: GoveePluginConfig,
      @Inject(TOKEN_PASSWORD_CONSTRAINTS) private readonly passwordConstraints: StringConstraints,
      @Inject(TOKEN_USERNAME_CONSTRAINTS) private readonly usernameConstraints: StringConstraints,
  ) {
  }

  public validUsername(): string {
    const username = this.goveePluginConfig.username;
    const allowedSymbols = this.usernameConstraints.allowedSymbols;
    const minSymbols = this.usernameConstraints.minSymbols;
    const minDigit = this.usernameConstraints.minDigits;
    const minLength = this.usernameConstraints.minLength;
    const maxLength = this.usernameConstraints.maxLength;
    const required = this.usernameConstraints.required;

    let schema =
        Joi.string()
            .regex(
                this.allowedSymbolsRegex(
                    allowedSymbols,
                    minSymbols,
                ),
            )
            .regex(
                this.digitsRegex(minDigit),
            )
            .regex(
                this.lengthRegex(
                    minLength,
                    maxLength,
                ),
            );
    if (required) {
      schema = schema.required();
    }

    const validResult = schema.validate(
        username,
        {
          abortEarly: true,
        },
    );

    if (validResult.error || validResult.warning) {
      throw new ValidationError(
          `${username} is not value`,
          validResult.error || validResult.warning,
          username,
      );
    }
    return validResult.value as string;
  }

  public validPassword(): string {
    const username = this.goveePluginConfig.username;
    const allowedSymbols = this.usernameConstraints.allowedSymbols;
    const minSymbols = this.usernameConstraints.minSymbols;
    const minDigit = this.usernameConstraints.minDigits;
    const minLength = this.usernameConstraints.minLength;
    const maxLength = this.usernameConstraints.maxLength;
    const required = this.usernameConstraints.required;

    let schema =
        Joi.string()
            .regex(
                this.allowedSymbolsRegex(
                    allowedSymbols,
                    minSymbols,
                ),
            )
            .regex(
                this.digitsRegex(minDigit),
            )
            .regex(
                this.lengthRegex(
                    minLength,
                    maxLength,
                ),
            );
    if (required) {
      schema = schema.required();
    }

    const validResult = schema.validate(
        username,
        {
          abortEarly: true,
        },
    );

    if (validResult.error || validResult.warning) {
      throw new ValidationError(
          `${username} is not value`,
          validResult.error || validResult.warning,
          username,
      );
    }
    return validResult.value as string;
  }

  private validConfig(
      configEntry: string,
      constraints: StringConstraints,
      maskValue = false,
  ): string {
    const allowedSymbols = constraints.allowedSymbols;
    const minSymbols = constraints.minSymbols;
    const minDigit = constraints.minDigits;
    const minLength = constraints.minLength;
    const maxLength = constraints.maxLength;
    const required = constraints.required;

    let schema =
        Joi.string()
            .regex(
                this.allowedSymbolsRegex(
                    allowedSymbols,
                    minSymbols,
                ),
            )
            .regex(
                this.digitsRegex(minDigit),
            )
            .regex(
                this.lengthRegex(
                    minLength,
                    maxLength,
                ),
            );
    if (required) {
      schema = schema.required();
    }

    const validResult = schema.validate(
        configEntry,
        {
          abortEarly: true,
        },
    );

    if (validResult.error || validResult.warning) {
      throw new ValidationError(
          'Username is not value',
          validResult.error || validResult.warning,
          maskValue ? 'CONFIG VALUE MASKED' : configEntry,
      );
    }
    return validResult.value as string;
  }

  private allowedSymbolsRegex(
      allowedSymbols: string,
      minSymbols: number,
  ): RegExp {
    return RegExp(`^(?=.*?(?:[${escapeRegExp(allowedSymbols)}].*){${minSymbols},})$`);
  }

  private digitsRegex(
      minDigits: number,
  ): RegExp {
    return RegExp(`^(?=.*?(?:\\d.*){${minDigits},})$`);
  }

  private lengthRegex(
      minLength: number,
      maxLength: number,
  ): RegExp {
    return RegExp(`^(?:.{${minLength},${maxLength}})$`);
  }

  private getValidationSchema(
      constraints: StringConstraints,
  ): Joi.StringSchema {
    const allowedSymbolsRegex =
        RegExp(`^(?=.*?(?:[${escapeRegExp(constraints.allowedSymbols)}].*){${constraints.minSymbols},})$`);
    const digitsRegex = RegExp(`^(?=.*?(?:\\d.*){${constraints.minDigits},})$`);
    const lengthRegex = RegExp(`^(?:.{${constraints.minLength},${constraints.maxLength}})$`);
    return Joi.string()
        .regex(allowedSymbolsRegex)
        .regex(digitsRegex)
        .regex(lengthRegex);
  }
}


