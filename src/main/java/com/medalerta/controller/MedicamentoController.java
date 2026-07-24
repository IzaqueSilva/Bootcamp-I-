package com.medalerta.controller;

import com.medalerta.model.Medicamento;
import com.medalerta.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medicamentos")
public class MedicamentoController {

    @Autowired
    private MedicamentoService medicamentoService;

    @GetMapping
    public List<Medicamento> listarTodos() {
        return medicamentoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicamento> buscarPorId(@PathVariable Integer id) {
        return medicamentoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Medicamento salvar(@RequestBody Medicamento medicamento) {
        return medicamentoService.save(medicamento);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicamento> atualizar(@PathVariable Integer id, @RequestBody Medicamento medicamento) {
        return medicamentoService.findById(id)
                .map(existente -> {
                    medicamento.setIdMedicamento(existente.getIdMedicamento());
                    Medicamento atualizado = medicamentoService.save(medicamento);
                    return ResponseEntity.ok(atualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        if (medicamentoService.findById(id).isPresent()) {
            medicamentoService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
