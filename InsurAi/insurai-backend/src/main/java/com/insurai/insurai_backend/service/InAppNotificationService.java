package com.insurai.insurai_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.Hr;
import com.insurai.insurai_backend.model.Notification;
import com.insurai.insurai_backend.repository.NotificationRepository;

@Service
public class InAppNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // ------------------ Create Notifications ------------------

    public Notification createNotification(String title, String message, Long targetId, String targetRole, String notificationType) {
        if (targetId == null || targetRole == null) return null; // safety check

        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetId(targetId);
        notification.setTargetRole(targetRole);
        notification.setNotificationType(notificationType != null ? notificationType : "GENERAL");
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    public Notification createClaimApprovedNotification(Claim claim) {
        if (claim.getEmployee() == null) return null;

        return createNotification(
            "Claim Approved",
            "Your claim #" + claim.getId() + " has been approved.",
            claim.getEmployee().getId(),
            "EMPLOYEE",
            "CLAIM"
        );
    }

    public Notification createClaimRejectedNotification(Claim claim) {
        if (claim.getEmployee() == null) return null;

        return createNotification(
            "Claim Rejected",
            "Your claim #" + claim.getId() + " has been rejected.",
            claim.getEmployee().getId(),
            "EMPLOYEE",
            "CLAIM"
        );
    }

    public Notification createClaimAssignedNotification(Claim claim, Hr assignedHr) {
        if (assignedHr == null) return null;

        return createNotification(
            "New Claim Assigned",
            "A new claim #" + claim.getId() + " has been assigned to you.",
            assignedHr.getId(),
            "HR",
            "CLAIM"
        );
    }

    // ------------------ Fetch Notifications ------------------

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByTargetIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByTargetIdAndReadStatusFalseOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getNotificationsByUserIdAndRole(Long userId, String role) {
        return notificationRepository.findByTargetIdAndTargetRoleOrderByCreatedAtDesc(userId, role);
    }

    public List<Notification> getUnreadNotificationsByUserIdAndRole(Long userId, String role) {
        return notificationRepository.findByTargetIdAndTargetRoleAndReadStatusFalseOrderByCreatedAtDesc(userId, role);
    }

    public List<Notification> getNotificationsByRole(String role) {
        return notificationRepository.findByTargetRoleOrderByCreatedAtDesc(role);
    }

    public List<Notification> getNotificationsByRoleAndType(String role, String type) {
        return notificationRepository.findByTargetRoleAndNotificationTypeOrderByCreatedAtDesc(role, type);
    }

    // ------------------ Update & Delete ------------------

    /**
     * Mark notification as read
     * Ensures numeric ID compatibility and logs if notification not found
     */
    public Notification markAsRead(Long notificationId) {
        if (notificationId == null) return null;

        Optional<Notification> optional = notificationRepository.findById(notificationId);
        if (optional.isPresent()) {
            Notification notification = optional.get();
            notification.setReadStatus(true);
            notification.setUpdatedAt(LocalDateTime.now());
            return notificationRepository.save(notification);
        } else {
            System.out.println("Notification ID not found: " + notificationId);
            return null;
        }
    }

    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId) {
        if (notificationId != null && notificationRepository.existsById(notificationId)) {
            notificationRepository.deleteById(notificationId);
        }
    }
}
