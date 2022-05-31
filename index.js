const multer = require("multer");
const express = require("express");
const tf = require("@tensorflow/tfjs-node");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.send("Hello World!");
});

const upload = multer({
  storage: multer.memoryStorage(),
});

async function predict({ file, path = "file://tfjs-model/model.json" }) {
  const IMG_SIZE = [128, 128];

  let pattern = /image\/(jpeg|png|jpg)/;
  if (!pattern.test(file.mimetype)) {
    throw new Error("File type not supported");
  }

  const tensor = tf.node.decodeImage(file.buffer);

  const model = await tf.loadGraphModel(path);

  const prediction = model.predict(
    tensor.resizeBilinear(IMG_SIZE).expandDims(0)
  );

  const predictionArray = Array.from(prediction.dataSync());
  const labels = [
    "barong",
    "bujuh",
    "dalem",
    "keras",
    "rangda",
    "sidakarya",
    "tua",
  ].sort();

  const result = predictionArray.map((prediction, index) => {
    return {
      label: labels[index],
      value: prediction,
    };
  });

  return result;
}

app.post(
  "/upload",
  upload.single(
    "image" /* name attribute of properties in your form-data request */
  ),
  async (req, res) => {
    try {
      const result = await predict({ file: req.file });
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(422).json({ message: error.message });
    }
  }
);

app.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`);
});
