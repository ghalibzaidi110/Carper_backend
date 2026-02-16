import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  MaxLength,
  Matches,
  IsEnum,
  IsOptional 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ 
    example: 'john@example.com',
    description: 'User email address (used for login)'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ 
    example: 'StrongPass123!',
    description: 'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)'
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)' }
  )
  password: string;

  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user'
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName: string;

  @ApiProperty({ 
    example: '+923001234567',
    description: 'Phone number with country code'
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { 
    message: 'Please provide a valid phone number with country code (e.g., +923001234567)' 
  })
  phoneNumber: string;

  @ApiProperty({ 
    example: 'Karachi',
    description: 'City of residence'
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters' })
  city: string;

  @ApiProperty({ 
    example: 'House 123, Street 5, DHA Phase 6',
    description: 'Complete address'
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MinLength(10, { message: 'Please provide a complete address (minimum 10 characters)' })
  address: string;

  @ApiProperty({ 
    enum: AccountType,
    example: AccountType.INDIVIDUAL,
    description: 'Account type: INDIVIDUAL or CAR_RENTAL'
  })
  @IsEnum(AccountType, { message: 'Account type must be either INDIVIDUAL or CAR_RENTAL' })
  @IsNotEmpty({ message: 'Account type is required' })
  accountType: AccountType;

  @ApiProperty({ 
    example: 'Pakistan',
    required: false,
    description: 'Country (defaults to Pakistan)'
  })
  @IsString()
  @IsOptional()
  country?: string;

  // Additional fields for CAR_RENTAL accounts
  @ApiProperty({ 
    example: 'Elite Car Rentals',
    required: false,
    description: 'Business name (required for CAR_RENTAL account type)'
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ 
    example: 'BL-12345',
    required: false,
    description: 'Business license number (optional for CAR_RENTAL)'
  })
  @IsString()
  @IsOptional()
  businessLicense?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
