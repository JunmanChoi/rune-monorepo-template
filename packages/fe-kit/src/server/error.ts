export class HttpException extends Error {
  constructor(
    private readonly response: string | Record<string, any>,
    private readonly status: number,
    public readonly cause?: unknown
  ) {
    super();
    this.message =
      typeof response === "string" ? response : JSON.stringify(response);
    this.name = this.constructor.name;
  }

  getResponse() {
    return this.response;
  }

  getStatus() {
    return this.status;
  }

  getCause() {
    return this.cause;
  }
}

// 미리 정의된 예외들
export class BadRequestException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Bad Request", 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Unauthorized", 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Forbidden", 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Not Found", 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Conflict", 409);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message?: string | Record<string, any>) {
    super(message ?? "Internal Server Error", 500);
  }
}
