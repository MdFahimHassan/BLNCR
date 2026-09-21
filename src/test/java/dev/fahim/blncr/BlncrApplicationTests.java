package dev.fahim.blncr;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// "test" profile points at an in-memory H2 database (see application-test.properties)
// instead of the local Postgres container, so the context can load in CI too.
@SpringBootTest
@ActiveProfiles("test")
class BlncrApplicationTests {

	@Test
	void contextLoads() {
	}

}