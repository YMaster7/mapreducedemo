import random
from flask import Flask, render_template, jsonify, request
import json

app = Flask(__name__)


def simulate_distributed_map_reduce(input_lines, mapper_count, reducer_count):
    def mapper(line):
        words = line.split()
        return [(word, 1) for word in words]

    def reducer(mapped_data):
        word_count = {}
        for word, count, _ in mapped_data:
            if word not in word_count:
                word_count[word] = 0
            word_count[word] += count
        return word_count

    # Divide input into chunks for mappers
    mapper_input = [(i, line) for i, line in enumerate(input_lines)]

    # Apply mappers
    mapper_output = []
    for i, (_, line) in enumerate(mapper_input):
        mapper_idx = i % mapper_count
        mapped_data = mapper(line)
        for word, count in mapped_data:
            mapper_output.append((word, count, mapper_idx))

    # Group mapper output by word
    word_groups = {}
    for word, count, mapper_idx in mapper_output:
        if word not in word_groups:
            word_groups[word] = []
        word_groups[word].append((count, mapper_idx))

    # Assign word groups to reducers
    reducer_input = [[] for _ in range(reducer_count)]
    for i, (word, word_data) in enumerate(word_groups.items()):
        reducer_idx = i % reducer_count
        reducer_input[reducer_idx].extend(
            [(word, count, mapper_idx) for count, mapper_idx in word_data]
        )

    # Apply reducers
    reducer_output = []
    for i, reducer_data in enumerate(reducer_input):
        reduced_data = reducer(reducer_data)
        for word, count in reduced_data.items():
            reducer_output.append((word, count, i))

    return mapper_input, mapper_output, reducer_output


@app.route('/wordcount', methods=['POST'])
def word_count():
    request_data = request.get_json()
    input_text = request_data.get('input_data')
    mapper_count = int(request_data.get('mapper_count', 3))
    reducer_count = int(request_data.get('reducer_count', 2))
    input_lines = input_text.splitlines()

    mapper_input, mapper_output, reducer_output = simulate_distributed_map_reduce(
        input_lines, mapper_count, reducer_count
    )

    response_data = {
        "input_data": input_text,
        "mapper_count": mapper_count,
        "reducer_count": reducer_count,
        "mapper_input": [{"offset": item[0], "data": item[1]} for item in mapper_input],
        "mapper_output": [
            {"word": item[0], "count": item[1], "mapper": item[2]}
            for item in mapper_output
        ],
        "reducer_output": [
            {"word": item[0], "count": item[1], "reducer": item[2]}
            for item in reducer_output
        ],
    }
    return jsonify(response_data)


@app.route('/')
def home():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
