import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  iss?: string;
  aud?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    };

    super(options);
    this.logger.log(
      `JwtStrategy initialized with secret length: ${jwtSecret.length}`,
    );
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(
      `Validating JWT payload for user: ${payload.sub}, email: ${payload.email}`,
    );

    try {
      // Validate user exists through AuthService
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        this.logger.warn(`User not found for JWT payload sub: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`JWT validation successful for user: ${payload.sub}`);
      return {
        userId: payload.sub,
        ...user,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
