package dev.fahim.blncr;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// The test profile uses in-memory H2, so the context loads without Postgres.
@SpringBootTest
@ActiveProfiles("test")
class BlncrApplicationTests {

	@Test
	void contextLoads() {
	}

}