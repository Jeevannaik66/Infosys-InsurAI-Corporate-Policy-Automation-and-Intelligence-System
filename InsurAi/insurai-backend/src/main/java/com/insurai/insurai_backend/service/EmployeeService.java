package com.insurai.insurai_backend.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.repository.EmployeeRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    // TODO: Replace with your actual secret key from application.properties or environment variable
    private final String jwtSecret = "YOUR_SECRET_KEY_HERE";

    /**
     * Registers a new employee.
     * Assumes password is already encoded and role is set in controller.
     */
    public Employee register(Employee employee) {
        return employeeRepository.save(employee);
    }

    /**
     * Validate employee credentials.
     */
    public boolean validateCredentials(Employee employee, String rawPassword, PasswordEncoder passwordEncoder) {
        return passwordEncoder.matches(rawPassword, employee.getPassword());
    }

    // -------------------- Generate simple token for Employee --------------------
    public String generateEmployeeToken(String identifier) {
        // Keep this for backward compatibility if needed
        String tokenData = identifier + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(tokenData.getBytes(StandardCharsets.UTF_8));
    }

    // -------------------- Verify employee token (JWT version) --------------------
    public boolean isEmployee(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[EmployeeService] Authorization header missing or invalid");
            return false;
        }

        try {
            String token = authHeader.substring(7).trim(); // Remove "Bearer " prefix
            if (token.isEmpty()) {
                System.out.println("[EmployeeService] Token is empty");
                return false;
            }

            // Parse JWT token
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject(); // JWT 'sub' claim is email
            boolean exists = employeeRepository.findByEmail(email).isPresent();

            if (!exists) {
                System.out.println("[EmployeeService] Employee not found for email: " + email);
            }

            return exists;

        } catch (Exception e) {
            System.out.println("[EmployeeService] JWT validation failed: " + e.getMessage());
            return false;
        }
    }

    // -------------------- Get Employee object from JWT token --------------------
    public Employee getEmployeeFromToken(String token) {
        if (token == null || token.isEmpty()) return null;

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject(); // 'sub' claim holds email
            return employeeRepository.findByEmail(email).orElse(null);

        } catch (Exception e) {
            System.out.println("[EmployeeService] Failed to get employee from token: " + e.getMessage());
            return null;
        }
    }

    // -------------------- Lookup Employee by Email --------------------
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email).orElse(null);
    }

    // -------------------- Lookup Employee by Employee ID --------------------
    public Employee findByEmployeeId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }
}
