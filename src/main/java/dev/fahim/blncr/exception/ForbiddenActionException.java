package dev.fahim.blncr.exception;

/**
 * Thrown when an authenticated group member tries to perform an action on a resource they
 * are not entitled to (e.g. recording a settlement between two OTHER people). Maps to HTTP 403.
 */
public class ForbiddenActionException extends RuntimeException {

    public ForbiddenActionException(String message) {
        super(message);
    }
}
