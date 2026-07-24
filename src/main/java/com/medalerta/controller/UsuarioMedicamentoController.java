package com.medalerta.controller;

import com.medalerta.model.UsuarioMedicamento;
import com.medalerta.model.UsuarioMedicamentoId;
import com.medalerta.service.UsuarioMedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescricoes")
public class UsuarioMedicamentoController {

    @Autowired
    private UsuarioMedicamentoService service;

    @GetMapping
    public List<UsuarioMedicamento> listarTodas() {
        return service.listarTodas();
    }

    @GetMapping("/alertas")
    public List<UsuarioMedicamento> listarAlertasAtivos() {
        return service.listarAlertasAtivos();
    }

    @PostMapping
    public UsuarioMedicamento criar(@RequestBody UsuarioMedicamento prescricao) {
        return service.salvar(prescricao);
    }

    @PostMapping("/{idUsuario}/{idMedicamento}/consumir")
    public ResponseEntity<UsuarioMedicamento> confirmarConsumo(
            @PathVariable Integer idUsuario,
            @PathVariable Integer idMedicamento) {
        UsuarioMedicamentoId id = new UsuarioMedicamentoId(idUsuario, idMedicamento);
        try {
            return ResponseEntity.ok(service.confirmarConsumo(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{idUsuario}/{idMedicamento}")
    public ResponseEntity<Void> deletar(
            @PathVariable Integer idUsuario,
            @PathVariable Integer idMedicamento) {
        UsuarioMedicamentoId id = new UsuarioMedicamentoId(idUsuario, idMedicamento);
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
