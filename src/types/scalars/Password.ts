import {ConstrainedString} from "./ConstrainedString";

export const Password = ConstrainedString(
    "Password",
    "Password for Govee user account.",
    {
        minLength: 8,
        maxLength: 20,
        minDigits: 1,
        required: true,
    }
)