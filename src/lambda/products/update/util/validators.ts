import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'

export const validateObject = async <T extends object>(cls: new () => T, body: T): Promise<ValidationError[]> => {
    const classInstance = plainToInstance(cls, body);
    const errors = await validate(classInstance);
    return errors;
};
