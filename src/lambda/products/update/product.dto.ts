import { IsNumber, IsOptional, IsString } from 'class-validator'

export interface Product {
    productId: string
    name: string
    description: string
    price: number
    imageUrl: string
}

export class CreateProductDTO {
    @IsString()
    name: string

    @IsString()
    description: string

    @IsNumber()
    price: number

    @IsString()
    imageBase64: string

    @IsString()
    imageType: string
}

export class UpdateProductDTO {
    @IsString()
    @IsOptional()
    name: string

    @IsString()
    @IsOptional()
    description: string

    @IsNumber()
    @IsOptional()
    price: number

    @IsString()
    @IsOptional()
    imageBase64?: string

    @IsString()
    @IsOptional()
    imageType?: string

    @IsString()
    @IsOptional()
    productId: string
}