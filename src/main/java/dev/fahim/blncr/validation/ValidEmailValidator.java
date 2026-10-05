package dev.fahim.blncr.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import javax.naming.Context;
import javax.naming.NameNotFoundException;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

public class ValidEmailValidator implements ConstraintValidator<ValidEmail, String> {

    private static final Logger log = LoggerFactory.getLogger(ValidEmailValidator.class);

    /** RFC 5321 limits: 254 chars total, 64 for the local part. */
    private static final int MAX_LENGTH = 254;
    private static final int MAX_LOCAL_LENGTH = 64;

    /** Dot-atom local part, DNS labels, then a letters-only (2-24) or punycode TLD. */
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*"
                    + "@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+"
                    + "(?:[A-Za-z]{2,24}|xn--[A-Za-z0-9-]{1,59})$");

    /** TLDs reserved by RFC 2606 / RFC 6761 / RFC 6762 or otherwise never routable on the public internet. */
    private static final Set<String> BLOCKED_TLDS = Set.of(
            "test", "example", "invalid", "localhost", "local", "localdomain",
            "internal", "lan", "home", "corp", "onion");

    /** Second-level domains reserved for documentation (RFC 2606). Subdomains are blocked too. */
    private static final Set<String> BLOCKED_DOMAINS = Set.of(
            "example.com", "example.net", "example.org");

    private static final long DNS_CACHE_TTL_MS = 10 * 60 * 1000L;
    private static final int DNS_CACHE_MAX_ENTRIES = 5_000;

    private record CachedResult(boolean ok, long expiresAt) {}

    private static final ConcurrentHashMap<String, CachedResult> DNS_CACHE = new ConcurrentHashMap<>();
    private static final AtomicBoolean DNS_UNAVAILABLE_LOGGED = new AtomicBoolean(false);

    /** app.email.mx-check=false skips the DNS lookup (offline dev, unit tests). Syntax and reserved-domain checks always run. */
    @Value("${app.email.mx-check:true}")
    private boolean mxCheckEnabled = true;

    public void setMxCheckEnabled(boolean mxCheckEnabled) {
        this.mxCheckEnabled = mxCheckEnabled;
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null/blank is handled by @NotBlank.
        if (value == null || value.isEmpty()) {
            return true;
        }
        if (value.length() > MAX_LENGTH || !EMAIL_PATTERN.matcher(value).matches()) {
            return false;
        }

        int at = value.lastIndexOf('@');
        if (at < 1 || at > MAX_LOCAL_LENGTH) {
            return false;
        }

        String domain = value.substring(at + 1).toLowerCase(Locale.ROOT);
        if (isReservedDomain(domain)) {
            return false;
        }
        return !mxCheckEnabled || domainCanReceiveMail(domain);
    }

    static boolean isReservedDomain(String domain) {
        String tld = domain.substring(domain.lastIndexOf('.') + 1);
        if (BLOCKED_TLDS.contains(tld)) {
            return true;
        }
        for (String blocked : BLOCKED_DOMAINS) {
            if (domain.equals(blocked) || domain.endsWith("." + blocked)) {
                return true;
            }
        }
        return false;
    }

    private static boolean domainCanReceiveMail(String domain) {
        long now = System.currentTimeMillis();
        CachedResult cached = DNS_CACHE.get(domain);
        if (cached != null && cached.expiresAt() > now) {
            return cached.ok();
        }

        boolean ok = lookupDomain(domain);

        if (DNS_CACHE.size() >= DNS_CACHE_MAX_ENTRIES) {
            DNS_CACHE.clear();
        }
        DNS_CACHE.put(domain, new CachedResult(ok, now + DNS_CACHE_TTL_MS));
        return ok;
    }

    /** False if the domain doesn't exist or publishes a null MX. Inconclusive DNS failures fail open, so a resolver hiccup never blocks sign-ups. */
    private static boolean lookupDomain(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", "2000");
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        DirContext ctx = null;
        try {
            ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"MX"});
            Attribute mx = attrs.get("MX");
            if (mx != null && mx.size() > 0) {
                boolean hasRealMx = false;
                NamingEnumeration<?> records = mx.getAll();
                while (records.hasMore()) {
                    String record = String.valueOf(records.next()).trim();
                    // "0 ." is a null MX (RFC 7505): the domain accepts no mail.
                    if (!record.endsWith(" .") && !record.equals(".")) {
                        hasRealMx = true;
                    }
                }
                return hasRealMx;
            }
            // No MX: fall back to the domain's A/AAAA record (RFC 5321).
            try {
                InetAddress.getByName(domain);
                return true;
            } catch (UnknownHostException e) {
                return false;
            }
        } catch (NameNotFoundException e) {
            return false; // NXDOMAIN: the domain does not exist
        } catch (NamingException e) {
            if (DNS_UNAVAILABLE_LOGGED.compareAndSet(false, true)) {
                log.warn("DNS lookup for email domain checks is unavailable ({}); "
                        + "allowing addresses whose domain cannot be verified.", e.toString());
            }
            return true;
        } finally {
            if (ctx != null) {
                try {
                    ctx.close();
                } catch (NamingException ignored) {
                    // ignored: closing the DNS context is best effort
                }
            }
        }
    }
}
