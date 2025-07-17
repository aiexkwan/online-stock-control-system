import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async login(loginDto: AuthLoginDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;

      // Sign in with Supabase Auth
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        this.logger.error(`Login failed for email ${email}: ${error.message}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!data.user) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Get user profile from database
      const userProfile = await this.getUserProfile(data.user.id);

      // Generate JWT tokens
      const payload = { sub: data.user.id, email: data.user.email };
      this.logger.debug(
        `Generating JWT for user ${data.user.id} with payload: ${JSON.stringify(payload)}`,
      );

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      this.logger.debug(
        `Using JWT secret length: ${jwtSecret?.length || 'undefined'}`,
      );

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: userProfile?.name || data.user.user_metadata?.name || null,
          role: userProfile?.role || 'user',
          department: userProfile?.department || 'System',
          position: userProfile?.position || 'User',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${(error as Error).message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async register(registerDto: AuthRegisterDto): Promise<AuthResponseDto> {
    try {
      const { email, password, name, department, role } = registerDto;

      // Check if user already exists
      const { data: existingUser } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Note: Password hashing is handled by Supabase Auth, not needed here

      // Sign up with Supabase Auth
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              department: department || 'System',
              role: role || 'user',
            },
          },
        });

      if (error) {
        this.logger.error(
          `Registration failed for email ${email}: ${error.message}`,
        );
        throw new BadRequestException(error.message);
      }

      if (!data.user) {
        throw new BadRequestException('Registration failed');
      }

      // Generate employee number (use timestamp + random for uniqueness)
      const employeeNumber =
        Date.now().toString().slice(-6) +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0');

      // Insert user profile into database - only include fields that exist in data_id table
      const { error: profileError } = await this.supabaseService
        .getClient()
        .from('data_id')
        .insert({
          id: employeeNumber, // Generate unique employee number
          email,
          name: name || null,
          position: role === 'admin' ? 'Admin' : 'User', // data_id uses 'position' not 'role'
          department: department || 'System', // Use provided department or default
          uuid: data.user.id, // Store Supabase UUID for consistency
          // Note: phone field doesn't exist in data_id table according to database schema
          // Note: password is stored in Supabase Auth, not in data_id table
        });

      if (profileError) {
        this.logger.error(`Profile creation failed: ${profileError.message}`);
        // Clean up Supabase auth user if profile creation fails
        await this.supabaseService
          .getClient()
          .auth.admin.deleteUser(data.user.id);
        throw new BadRequestException('Profile creation failed');
      }

      // Generate JWT tokens
      const payload = { sub: data.user.id, email: data.user.email };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: name || null,
          role: role || 'user',
          department: department || 'System',
          position: role === 'admin' ? 'Admin' : 'User',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Registration error: ${(error as Error).message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const userProfile = await this.getUserProfile(data.user.id);

      const payload = { sub: data.user.id, email: data.user.email };
      const accessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: userProfile?.name || null,
          role: userProfile?.role || 'user',
          department: userProfile?.department || 'System',
          position: userProfile?.position || 'User',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh error: ${(error as Error).message}`);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async validateUser(userId: string): Promise<UserDto | null> {
    try {
      // 1. First try to get user from Supabase Auth with retry
      try {
        const { data: user, error } = await this.withRetry(() =>
          this.supabaseService.getClient().auth.admin.getUserById(userId),
        );

        if (!error && user?.user) {
          return await this.mapAuthUserToDto(user.user);
        }
      } catch (authError) {
        this.logger.warn(
          `Supabase Auth failed for user ${userId}: ${(authError as Error).message}`,
        );
      }

      // 2. Fallback: get user from local database
      this.logger.log(`Falling back to database lookup for user ${userId}`);
      return await this.getUserFromDatabase(userId);
    } catch (error) {
      this.logger.error(`User validation error: ${(error as Error).message}`);
      return null;
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async getUserFromDatabase(userId: string): Promise<UserDto | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('id, email, name, position, department')
        .eq('uuid', userId)
        .single();

      if (error) {
        this.logger.warn(
          `Database user lookup failed for ${userId}: ${error.message}`,
        );

        // Final fallback: create a basic user object for valid UUID
        if (this.isValidUUID(userId)) {
          this.logger.log(
            `Creating fallback user object for valid UUID: ${userId}`,
          );
          return {
            id: userId,
            email: 'unknown@example.com',
            role: 'user',
            created_at: new Date().toISOString(),
            email_verified: false,
          };
        }
        return null;
      }

      return data ? this.mapDbUserToDto(data) : null;
    } catch (dbError) {
      this.logger.error(
        `Database error in getUserFromDatabase: ${(dbError as Error).message}`,
      );

      // Final fallback for valid UUIDs
      if (this.isValidUUID(userId)) {
        this.logger.log(`Emergency fallback user object for UUID: ${userId}`);
        return {
          id: userId,
          email: 'unknown@example.com',
          role: 'user',
          created_at: new Date().toISOString(),
          email_verified: false,
        };
      }
      return null;
    }
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private async mapAuthUserToDto(authUser: any): Promise<UserDto> {
    // Optionally get additional user info from data_id table for display name
    let displayName = authUser.user_metadata?.name || null;
    let role = 'user';
    let department = 'System';
    let position = 'User';

    try {
      const { data: profileData } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('name, position, department')
        .eq('email', authUser.email)
        .single();

      if (profileData) {
        displayName = profileData.name || displayName;
        role = profileData.position === 'Admin' ? 'admin' : 'user';
        department = profileData.department || department;
        position = profileData.position || position;
      }
    } catch (profileError) {
      // Profile lookup is optional, don't fail authentication
      this.logger.warn(`Profile lookup failed for ${authUser.email}`);
    }

    const result: any = {
      id: authUser.id,
      email: authUser.email!,
      created_at: authUser.created_at,
      email_verified: !!authUser.email_confirmed_at,
    };

    if (displayName) {
      result.name = displayName;
    }

    if (role) {
      result.role = role;
    }

    if (department) {
      result.department = department;
    }

    if (position) {
      result.position = position;
    }

    if (authUser.updated_at) {
      result.updated_at = authUser.updated_at;
    }

    return result;
  }

  private mapDbUserToDto(dbUser: any): UserDto {
    const result: any = {
      id: dbUser.id,
      email: dbUser.email,
      created_at: new Date().toISOString(),
      email_verified: true, // Assume verified if in database
    };

    if (dbUser.name) {
      result.name = dbUser.name;
    }

    result.role = dbUser.position === 'Admin' ? 'admin' : 'user';
    result.department = dbUser.department || 'System';
    result.position = dbUser.position || 'User';

    return result;
  }

  async logout(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient().auth.signOut();

      if (error) {
        this.logger.error(`Logout error: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Logout error: ${(error as Error).message}`);
    }
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('name, position, department')
        .eq('uuid', userId)
        .single();

      if (error) {
        this.logger.warn(
          `User profile not found for ID ${userId}: ${error.message}`,
        );
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(`Get user profile error: ${(error as Error).message}`);
      return null;
    }
  }

  async getUserProfileByEmail(email: string): Promise<{ data: any }> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('name, position, department')
        .eq('email', email)
        .single();

      if (error) {
        this.logger.warn(
          `User profile not found for email ${email}: ${error.message}`,
        );
        return { data: null };
      }

      return {
        data: {
          name: data.name,
          role: data.position === 'Admin' ? 'admin' : 'user',
          department: data.department,
          position: data.position,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get user profile by email error: ${(error as Error).message}`,
      );
      return { data: null };
    }
  }
}
