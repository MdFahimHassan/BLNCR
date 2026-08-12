package dev.fahim.blncr.exception;

/**
 * Thrown for semantically invalid requests that pass bean validation but violate a business rule
 * — e.g. split amounts that don't add up to the expense total, percentages that don't sum to 100,
 * duplicate participants in a split, or a settlement between the same user.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}