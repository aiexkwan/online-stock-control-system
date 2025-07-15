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
          phone: userProfile?.phone || data.user.user_metadata?.phone || null,
          role: userProfile?.role || 'user',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async register(registerDto: AuthRegisterDto): Promise<AuthResponseDto> {
    try {
      const { email, password, name, phone, role } = registerDto;

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

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Sign up with Supabase Auth
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
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

      // Insert user profile into database
      const { error: profileError } = await this.supabaseService
        .getClient()
        .from('data_id')
        .insert({
          id: data.user.id,
          email,
          name: name || null,
          phone: phone || null,
          role: role || 'user',
          password_hash: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
          phone: phone || null,
          role: role || 'user',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`);
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
          phone: userProfile?.phone || null,
          role: userProfile?.role || 'user',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
          email_verified: data.user.email_confirmed_at ? true : false,
        },
      };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async validateUser(userId: string): Promise<UserDto | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        created_at: data.created_at,
        updated_at: data.updated_at,
        email_verified: true, // Assuming email is verified if user exists
      };
    } catch (error) {
      this.logger.error(`User validation error: ${error.message}`);
      return null;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient().auth.signOut();

      if (error) {
        this.logger.error(`Logout error: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
    }
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('data_id')
        .select('name, phone, role')
        .eq('id', userId)
        .single();

      if (error) {
        this.logger.warn(
          `User profile not found for ID ${userId}: ${error.message}`,
        );
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(`Get user profile error: ${error.message}`);
      return null;
    }
  }
}
