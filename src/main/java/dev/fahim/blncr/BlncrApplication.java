package dev.fahim.blncr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BlncrApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlncrApplication.class, args);
	}

	@Bean
	ObjectMapper objectMapper() {
		return new ObjectMapper().registerModule(new JavaTimeModule());
	}

}
