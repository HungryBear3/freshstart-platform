/**
 * Simple logging utility
 * For production, consider integrating with Sentry, LogRocket, or similar
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    const errorStr = error ? ` Error: ${error.message}${error.stack ? `\n${error.stack}` : ""}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatMessage(entry)

    // In development, log to console
    if (this.isDevelopment) {
      switch (level) {
        case "debug":
          console.debug(formatted)
          break
        case "info":
          console.info(formatted)
          break
        case "warn":
          console.warn(formatted)
          break
        case "error":
          console.error(formatted)
          break
      }
    }

    // In production, you would send to logging service
    if (this.isProduction) {
      // TODO: Send to Sentry, LogRocket, or similar
      // For now, still log errors to console
      if (level === "error") {
        console.error(formatted)
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error)
  }
}

export const logger = new Logger()
