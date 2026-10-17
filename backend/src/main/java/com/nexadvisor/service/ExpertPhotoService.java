package com.nexadvisor.service;

import com.nexadvisor.entity.Expert;
import com.nexadvisor.exception.ApiException;
import com.nexadvisor.repository.*;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpertPhotoService {
  private final ExpertService experts;
  private final ExpertRepository repository;
  private final AccountService accounts;
  private final AccountRepository locks;

  public ExpertPhotoService(
      ExpertService experts,
      ExpertRepository repository,
      AccountService accounts,
      AccountRepository locks) {
    this.experts = experts;
    this.repository = repository;
    this.accounts = accounts;
    this.locks = locks;
  }

  public byte[] get(UUID actor, UUID id) {
    var expert = experts.get(id);
    boolean allowed =
        expert.status().equals("APPROVED")
            || expert.accountId().equals(actor)
            || (actor != null && accounts.get(actor).role().equals("ADMIN"));
    ApiException.require(allowed, 404, "Photo not found");
    String data = repository.photo(id);
    ApiException.require(!data.isEmpty(), 404, "Photo not found");
    return Base64.getDecoder().decode(data);
  }

  @Transactional
  public Expert save(UUID actor, String data) {
    accounts.requireRole(actor, "EXPERT");
    accounts.requireVerified(actor);
    locks.lock(actor);
    var expert =
        experts
            .mine(actor)
            .orElseThrow(
                () ->
                    new ApiException(404, "Save your professional profile before adding a photo"));
    repository.photo(expert.id(), data.isEmpty() ? "" : normalize(data));
    return experts.get(expert.id());
  }

  private String normalize(String data) {
    ApiException.require(data.length() <= 2800000, 400, "Choose a JPEG or PNG photo under 2 MB");
    try {
      byte[] bytes = Base64.getDecoder().decode(data);
      ApiException.require(bytes.length <= 2 * 1024 * 1024, 400, "Choose a photo under 2 MB");
      try (var stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
        var readers = ImageIO.getImageReaders(stream);
        ApiException.require(readers.hasNext(), 400, "Choose a valid JPEG or PNG photo");
        var reader = readers.next();
        try {
          String format = reader.getFormatName();
          ApiException.require(
              format.equalsIgnoreCase("JPEG") || format.equalsIgnoreCase("PNG"),
              400,
              "Only JPEG and PNG photos are supported");
          reader.setInput(stream);
          int width = reader.getWidth(0), height = reader.getHeight(0);
          ApiException.require(
              width > 0 && height > 0 && width <= 4096 && height <= 4096,
              400,
              "Photo dimensions must be at most 4096 × 4096 pixels");
          var source = reader.read(0);
          var output = new BufferedImage(384, 384, BufferedImage.TYPE_INT_RGB);
          var graphics = output.createGraphics();
          try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, 384, 384);
            graphics.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            int size = Math.min(width, height), x = (width - size) / 2, y = (height - size) / 2;
            graphics.drawImage(source, 0, 0, 384, 384, x, y, x + size, y + size, null);
          } finally {
            graphics.dispose();
          }
          var result = new ByteArrayOutputStream();
          ImageIO.write(output, "JPEG", result);
          return Base64.getEncoder().encodeToString(result.toByteArray());
        } finally {
          reader.dispose();
        }
      }
    } catch (IllegalArgumentException | IOException ex) {
      throw new ApiException(400, "Choose a valid JPEG or PNG photo");
    }
  }
}
