// import { db } from '../config/db.js';

// import { uploadGalleryImageToS3,deleteGalleryImageFromS3 } from "../services/galleryUpload.service.js"


// export const uploadGalleryImage = async (req, res) => {
//   try {
//     const { title, description } = req.body;

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select an image",
//       });
//     }

//     const upload = await uploadGalleryImageToS3(req.file);

//     await db.query(
//       `
//       INSERT INTO gallery_images
//       (title, description, image_url, s3_key)
//       VALUES (?,?,?,?)
//       `,
//       [
//         title,
//         description,
//         upload.image_url,
//         upload.s3_key,
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       message: "Gallery image uploaded successfully",
//       data: upload,
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: "Upload failed",
//     });

//   }
// };


// export const getGalleryImages = async (req, res) => {
//   try {

//     const [images] = await db.query(
//       `
//       SELECT *
//       FROM gallery_images
//       WHERE status='active'
//       ORDER BY created_at DESC
//       `
//     );

//     res.json({
//       success: true,
//       data: images,
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: "Unable to fetch gallery",
//     });

//   }
// };

// export const updateGalleryImage = async (req,res)=>{}

// export const deleteGalleryImage = async (req,res)=>{}



// export const addGalleryVideo = async (req,res)=>{}

// export const getGalleryVideos = async (req,res)=>{}

// export const updateGalleryVideo = async (req,res)=>{}

// export const deleteGalleryVideo = async (req,res)=>{}




    import { db } from "../config/db.js";

import {
  uploadGalleryImageToS3,
  deleteGalleryImageFromS3,
} from "../services/galleryUpload.service.js";


/* =====================================================
   IMAGE CONTROLLERS
===================================================== */


/* =====================================================
   UPLOAD GALLERY IMAGE
===================================================== */

export const uploadGalleryImage = async (req, res) => {
  try {
    const { title, description } = req.body;

    /* Validate title */

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    /* Validate image */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    /* Upload image to S3 */

    const upload = await uploadGalleryImageToS3(req.file);

    /* Save in MySQL */

    const [result] = await db.query(
      `
      INSERT INTO gallery_images
      (
        title,
        description,
        image_url,
        s3_key,
        status
      )
      VALUES (?, ?, ?, ?, 'active')
      `,
      [
        title.trim(),
        description || null,
        upload.image_url,
        upload.s3_key,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully",

      data: {
        id: result.insertId,
        title: title.trim(),
        description: description || null,
        image_url: upload.image_url,
        status: "active",
      },
    });

  } catch (err) {
    console.error("UPLOAD GALLERY IMAGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};


/* =====================================================
   GET GALLERY IMAGES
===================================================== */

export const getGalleryImages = async (req, res) => {
  try {
    const [images] = await db.query(
      `
      SELECT
        id,
        title,
        description,
        image_url,
        status,
        created_at,
        updated_at
      FROM gallery_images
      WHERE status = 'active'
      ORDER BY created_at DESC
      `
    );

    res.json({
      success: true,
      data: images,
    });

  } catch (err) {
    console.error("GET GALLERY IMAGES ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Unable to fetch gallery",
    });
  }
};


/* =====================================================
   UPDATE GALLERY IMAGE
===================================================== */

// export const updateGalleryImage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description, status } = req.body;

//     /* ---------------------------------------------
//        Find existing image
//     --------------------------------------------- */

//     const [[existingImage]] = await db.query(
//       `
//       SELECT *
//       FROM gallery_images
//       WHERE id = ?
//       `,
//       [id]
//     );

//     if (!existingImage) {
//       return res.status(404).json({
//         success: false,
//         message: "Gallery image not found",
//       });
//     }


//     /* ---------------------------------------------
//        Validate title if provided
//     --------------------------------------------- */

//     if (title !== undefined && !title.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Title cannot be empty",
//       });
//     }


//     /* ---------------------------------------------
//        Validate status
//     --------------------------------------------- */

//     if (
//       status !== undefined &&
//       !["active", "inactive"].includes(status)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }


//     /* =================================================
//        CASE 1
//        New image uploaded
//     ================================================= */

//     if (req.file) {

//       /* Upload new image */

//       const upload = await uploadGalleryImageToS3(req.file);


//       /* Update MySQL */

//       await db.query(
//         `
//         UPDATE gallery_images
//         SET
//           title = ?,
//           description = ?,
//           image_url = ?,
//           s3_key = ?,
//           status = ?
//         WHERE id = ?
//         `,
//         [
//           title !== undefined
//             ? title.trim()
//             : existingImage.title,

//           description !== undefined
//             ? description
//             : existingImage.description,

//           upload.image_url,

//           upload.s3_key,

//           status !== undefined
//             ? status
//             : existingImage.status,

//           id,
//         ]
//       );


//       /* ---------------------------------------------
//          Delete old S3 image
//       --------------------------------------------- */

//       try {
//         await deleteGalleryImageFromS3(
//           existingImage.s3_key
//         );
//       } catch (s3Error) {

//         /*
//           Don't fail the entire request.

//           New image is already uploaded and
//           database is updated.
//         */

//         console.error(
//           "OLD GALLERY IMAGE DELETE ERROR:",
//           s3Error
//         );
//       }


//       return res.json({
//         success: true,
//         message: "Gallery image updated successfully",

//         data: {
//           id,
//           image_url: upload.image_url,
//         },
//       });
//     }


//     /* =================================================
//        CASE 2
//        Only title / description / status changed
//     ================================================= */

//     await db.query(
//       `
//       UPDATE gallery_images
//       SET
//         title = ?,
//         description = ?,
//         status = ?
//       WHERE id = ?
//       `,
//       [
//         title !== undefined
//           ? title.trim()
//           : existingImage.title,

//         description !== undefined
//           ? description
//           : existingImage.description,

//         status !== undefined
//           ? status
//           : existingImage.status,

//         id,
//       ]
//     );


//     res.json({
//       success: true,
//       message: "Gallery image updated successfully",
//     });

//   } catch (err) {

//     console.error("UPDATE GALLERY IMAGE ERROR:", err);

//     res.status(500).json({
//       success: false,
//       message: "Unable to update gallery image",
//     });
//   }
// };


export const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Get existing image
    const [[existing]] = await db.query(
      `SELECT * FROM gallery_images WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    let imageUrl = existing.image_url;
    let s3Key = existing.s3_key;

    // If a new image was uploaded
    if (req.file) {
      const upload = await uploadGalleryImageToS3(req.file);

      imageUrl = upload.image_url;
      s3Key = upload.s3_key;

      // Delete old image AFTER new upload succeeds
      if (existing.s3_key) {
        try {
          await deleteGalleryImageFromS3(existing.s3_key);
        } catch (s3Error) {
          console.error(
            "Old S3 image could not be deleted:",
            s3Error.message
          );

          // We don't fail the update because the new image
          // was successfully uploaded.
        }
      }
    }

    await db.query(
      `UPDATE gallery_images
       SET title = ?,
           description = ?,
           image_url = ?,
           s3_key = ?
       WHERE id = ?`,
      [
        title ?? existing.title,
        description ?? existing.description,
        imageUrl,
        s3Key,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Gallery image updated successfully",
      data: {
        id,
        title: title ?? existing.title,
        description: description ?? existing.description,
        image_url: imageUrl,
        s3_key: s3Key,
      },
    });

  } catch (err) {
    console.error("UPDATE GALLERY IMAGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Gallery image update failed",
    });
  }
};

/* =====================================================
   DELETE GALLERY IMAGE
===================================================== */

// export const deleteGalleryImage = async (req, res) => {
//   try {
//     const { id } = req.params;


//     /* ---------------------------------------------
//        Find image
//     --------------------------------------------- */

//     const [[image]] = await db.query(
//       `
//       SELECT *
//       FROM gallery_images
//       WHERE id = ?
//       `,
//       [id]
//     );

//     if (!image) {
//       return res.status(404).json({
//         success: false,
//         message: "Gallery image not found",
//       });
//     }


//     /* ---------------------------------------------
//        Delete image from S3
//     --------------------------------------------- */

//     if (image.s3_key) {
//       try {

//         await deleteGalleryImageFromS3(
//           image.s3_key
//         );

//       } catch (s3Error) {

//         console.error(
//           "S3 DELETE ERROR:",
//           s3Error
//         );

//         return res.status(500).json({
//           success: false,
//           message: "Unable to delete image from S3",
//         });
//       }
//     }


//     /* ---------------------------------------------
//        Delete database record
//     --------------------------------------------- */

//     await db.query(
//       `
//       DELETE FROM gallery_images
//       WHERE id = ?
//       `,
//       [id]
//     );


//     res.json({
//       success: true,
//       message: "Gallery image deleted successfully",
//     });

//   } catch (err) {

//     console.error("DELETE GALLERY IMAGE ERROR:", err);

//     res.status(500).json({
//       success: false,
//       message: "Unable to delete gallery image",
//     });
//   }
// };

export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const [[image]] = await db.query(
      `SELECT * FROM gallery_images WHERE id = ?`,
      [id]
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    // Delete from S3
    if (image.s3_key) {
      await deleteGalleryImageFromS3(image.s3_key);
    }

    // Delete from MySQL
    await db.query(
      `DELETE FROM gallery_images WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Gallery image deleted successfully",
    });

  } catch (err) {
    console.error("DELETE GALLERY IMAGE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Gallery image deletion failed",
      error: err.message,
    });
  }
};

/* =====================================================
   VIDEO CONTROLLERS
===================================================== */


/* =====================================================
   YOUTUBE URL HELPER
===================================================== */

const getYouTubeVideoId = (url) => {
  try {

    const parsedUrl = new URL(url);

    /* youtube.com/watch?v=VIDEO_ID */

    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname === "/watch"
    ) {
      return parsedUrl.searchParams.get("v");
    }


    /* youtube.com/embed/VIDEO_ID */

    if (
      parsedUrl.hostname.includes("youtube.com") &&
      parsedUrl.pathname.startsWith("/embed/")
    ) {
      return parsedUrl.pathname.split("/embed/")[1];
    }


    /* youtu.be/VIDEO_ID */

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.substring(1);
    }


    return null;

  } catch {
    return null;
  }
};


/* =====================================================
   ADD GALLERY VIDEO
===================================================== */

export const addGalleryVideo = async (req, res) => {
  try {

    const {
      title,
      description,
      youtube_url,
    } = req.body;


    /* Validate title */

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }


    /* Validate YouTube URL */

    if (!youtube_url || !youtube_url.trim()) {
      return res.status(400).json({
        success: false,
        message: "YouTube URL is required",
      });
    }


    /* Extract video ID */

    const videoId = getYouTubeVideoId(
      youtube_url.trim()
    );


    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL",
      });
    }


    /* Create embed URL */

    const embedUrl =
      `https://www.youtube.com/embed/${videoId}`;


    /* Save */

    const [result] = await db.query(
      `
      INSERT INTO gallery_videos
      (
        title,
        description,
        youtube_url,
        embed_url,
        status
      )
      VALUES (?, ?, ?, ?, 'active')
      `,
      [
        title.trim(),
        description || null,
        youtube_url.trim(),
        embedUrl,
      ]
    );


    res.status(201).json({
      success: true,
      message: "Gallery video added successfully",

      data: {
        id: result.insertId,
        title: title.trim(),
        description: description || null,
        youtube_url: youtube_url.trim(),
        embed_url: embedUrl,
        status: "active",
      },
    });

  } catch (err) {

    console.error("ADD GALLERY VIDEO ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Unable to add video",
    });
  }
};


/* =====================================================
   GET GALLERY VIDEOS
===================================================== */

export const getGalleryVideos = async (req, res) => {
  try {

    const [videos] = await db.query(
      `
      SELECT
        id,
        title,
        description,
        youtube_url,
        embed_url,
        status,
        created_at,
        updated_at
      FROM gallery_videos
      WHERE status = 'active'
      ORDER BY created_at DESC
      `
    );


    res.json({
      success: true,
      data: videos,
    });

  } catch (err) {

    console.error("GET GALLERY VIDEOS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Unable to fetch videos",
    });
  }
};


/* =====================================================
   UPDATE GALLERY VIDEO
===================================================== */

// export const updateGalleryVideo = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const {
//       title,
//       description,
//       youtube_url,
//       status,
//     } = req.body;


//     /* ---------------------------------------------
//        Find existing video
//     --------------------------------------------- */

//     const [[existingVideo]] = await db.query(
//       `
//       SELECT *
//       FROM gallery_videos
//       WHERE id = ?
//       `,
//       [id]
//     );


//     if (!existingVideo) {
//       return res.status(404).json({
//         success: false,
//         message: "Gallery video not found",
//       });
//     }


//     /* ---------------------------------------------
//        Validate title
//     --------------------------------------------- */

//     if (
//       title !== undefined &&
//       !title.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Title cannot be empty",
//       });
//     }


//     /* ---------------------------------------------
//        Validate status
//     --------------------------------------------- */

//     if (
//       status !== undefined &&
//       !["active", "inactive"].includes(status)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }


//     let finalYoutubeUrl =
//       existingVideo.youtube_url;

//     let finalEmbedUrl =
//       existingVideo.embed_url;


//     /* ---------------------------------------------
//        If YouTube URL changed
//     --------------------------------------------- */

//     if (
//       youtube_url !== undefined &&
//       youtube_url.trim()
//     ) {

//       const videoId = getYouTubeVideoId(
//         youtube_url.trim()
//       );


//       if (!videoId) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid YouTube URL",
//         });
//       }


//       finalYoutubeUrl =
//         youtube_url.trim();

//       finalEmbedUrl =
//         `https://www.youtube.com/embed/${videoId}`;
//     }


//     /* ---------------------------------------------
//        Update
//     --------------------------------------------- */

//     await db.query(
//       `
//       UPDATE gallery_videos
//       SET
//         title = ?,
//         description = ?,
//         youtube_url = ?,
//         embed_url = ?,
//         status = ?
//       WHERE id = ?
//       `,
//       [
//         title !== undefined
//           ? title.trim()
//           : existingVideo.title,

//         description !== undefined
//           ? description
//           : existingVideo.description,

//         finalYoutubeUrl,

//         finalEmbedUrl,

//         status !== undefined
//           ? status
//           : existingVideo.status,

//         id,
//       ]
//     );


//     res.json({
//       success: true,
//       message: "Gallery video updated successfully",
//     });

//   } catch (err) {

//     console.error(
//       "UPDATE GALLERY VIDEO ERROR:",
//       err
//     );

//     res.status(500).json({
//       success: false,
//       message: "Unable to update video",
//     });
//   }
// };

export const updateGalleryVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      youtube_url,
      status,
    } = req.body || {};

    /* ---------------------------------------------
       Find existing video
    --------------------------------------------- */

    const [[existingVideo]] = await db.query(
      `
      SELECT *
      FROM gallery_videos
      WHERE id = ?
      `,
      [id]
    );

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Gallery video not found",
      });
    }

    /* ---------------------------------------------
       Validate title
    --------------------------------------------- */

    if (
      title !== undefined &&
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    /* ---------------------------------------------
       Validate status
    --------------------------------------------- */

    if (
      status !== undefined &&
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    /* ---------------------------------------------
       Existing values
    --------------------------------------------- */

    let finalTitle = existingVideo.title;

    let finalDescription = existingVideo.description;

    let finalYoutubeUrl = existingVideo.youtube_url;

    let finalEmbedUrl = existingVideo.embed_url;

    let finalStatus = existingVideo.status;


    /* ---------------------------------------------
       Update title
    --------------------------------------------- */

    if (title !== undefined) {
      finalTitle = title.trim();
    }


    /* ---------------------------------------------
       Update description
    --------------------------------------------- */

    if (description !== undefined) {
      finalDescription = description;
    }


    /* ---------------------------------------------
       Update YouTube URL
    --------------------------------------------- */

    if (
      youtube_url !== undefined &&
      youtube_url.trim()
    ) {

      const videoId = getYouTubeVideoId(
        youtube_url.trim()
      );

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: "Invalid YouTube URL",
        });
      }

      finalYoutubeUrl = youtube_url.trim();

      finalEmbedUrl =
        `https://www.youtube.com/embed/${videoId}`;
    }


    /* ---------------------------------------------
       Update status
    --------------------------------------------- */

    if (status !== undefined) {
      finalStatus = status;
    }


    /* ---------------------------------------------
       Update database
    --------------------------------------------- */

    await db.query(
      `
      UPDATE gallery_videos
      SET
        title = ?,
        description = ?,
        youtube_url = ?,
        embed_url = ?,
        status = ?
      WHERE id = ?
      `,
      [
        finalTitle,
        finalDescription,
        finalYoutubeUrl,
        finalEmbedUrl,
        finalStatus,
        id,
      ]
    );


    res.json({
      success: true,
      message: "Gallery video updated successfully",

      data: {
        id: Number(id),
        title: finalTitle,
        description: finalDescription,
        youtube_url: finalYoutubeUrl,
        embed_url: finalEmbedUrl,
        status: finalStatus,
      },
    });

  } catch (err) {

    console.error(
      "UPDATE GALLERY VIDEO ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Unable to update video",
    });
  }
};


/* =====================================================
   DELETE GALLERY VIDEO
===================================================== */

export const deleteGalleryVideo = async (req, res) => {
  try {

    const { id } = req.params;


    /* ---------------------------------------------
       Check video
    --------------------------------------------- */

    const [[video]] = await db.query(
      `
      SELECT id
      FROM gallery_videos
      WHERE id = ?
      `,
      [id]
    );


    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Gallery video not found",
      });
    }


    /* ---------------------------------------------
       Delete
    --------------------------------------------- */

    await db.query(
      `
      DELETE FROM gallery_videos
      WHERE id = ?
      `,
      [id]
    );


    res.json({
      success: true,
      message: "Gallery video deleted successfully",
    });

  } catch (err) {

    console.error(
      "DELETE GALLERY VIDEO ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Unable to delete video",
    });
  }
};