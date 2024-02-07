<?php

print_r($_FILES);
print_r($_POST);

function gen_random_filename() {
    $permitted_chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $res = '';
    for($i = 0;$i < 20;$i++) {
        $random_char = $permitted_chars[mt_rand(0, strlen($permitted_chars)-1)];
        $res .= $random_char;
    }
    return $res;
}

$target_dir = "uploads/";
$rand_filename = $target_dir . gen_random_filename();
$orig_filename = basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($orig_filename,PATHINFO_EXTENSION));

echo "Hallo";
echo $orig_filename;
echo $rand_filename;
echo $imageFileType;

// Check if file already exists
if (file_exists($rand_filename)) {
  echo "Sorry, file already exists.";
  $uploadOk = 0;
}

// Check file size
if ($_FILES["fileToUpload"]["size"] > 200000000) {
  echo "Sorry, your file is too large.";
  $uploadOk = 0;
}

// Allow certain file formats
if($imageFileType != "bin" && $imageFileType != "tlog" ) {
  echo $orig_filename;
  echo $imageFileType;
  echo $rand_filename;
  echo "Sorry, only BIN and TLOG files are allowed.";
  $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
  echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
  if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $rand_filename)) {
    echo "The file ". htmlspecialchars( basename( $_FILES["fileToUpload"]["name"])). " has been uploaded.";
    echo "To: " . $rand_filename;
  } else {
    echo "Sorry, there was an error uploading your file.";
  }
}
?>